const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('no-zygote')
app.commandLine.appendSwitch('disable-dev-shm-usage')
app.disableHardwareAcceleration()

if (process.platform === 'darwin') app.dock?.hide()

const quiz = require('./quiz')
const db = require('./db')
const { TICK_MS } = require('./constants')
const settingsStore = require('./settings-store')

let tray = null
let popupWindow = null
let settingsWindow = null
let lessonPickerWindow = null
let isPopupOpen = false
let isPaused = false
let lastShownAt = 0
let settings = {}
let iconActive = null
let iconPaused = null
let allLessons = []

function getWordsPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'words.json')
  }
  return path.join(app.getAppPath(), 'src', 'words.json')
}

async function loadVocabulary() {
  try {
    const lessonNumbers = settings.selectedLessonIds || []
    const data = await db.fetchAll(lessonNumbers.length > 0 ? lessonNumbers : null)
    if (data.lessons) allLessons = data.lessons
    if (data.vocabulary) quiz.setWords(data.vocabulary)
  } catch (e) {
    console.error('API unavailable, falling back to local words.json:', e.message)
    try {
      const local = JSON.parse(fs.readFileSync(getWordsPath(), 'utf-8'))
      quiz.setWords(local)
    } catch (e2) {
      console.error('Failed to load local words.json:', e2.message)
    }
  }
}

function updateTray() {
  tray.setImage(isPaused ? iconPaused : iconActive)
  tray.setToolTip(isPaused ? 'Kana Quiz (tạm dừng)' : 'Kana Quiz')

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Kana Quiz', enabled: false },
      { type: 'separator' },
      { label: isPaused ? 'Tiếp tục' : 'Tạm dừng', click: () => { isPaused = !isPaused; updateTray() } },
      { label: 'Quiz ngay', enabled: !isPaused, click: () => createPopup() },
      { label: 'Chọn bài', click: () => openLessonPicker() },
      { label: 'Cài đặt', click: () => openSettings() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )
}

function createPopup() {
  if (isPopupOpen) return

  const word = quiz.getNextWord()
  if (!word) return

  isPopupOpen = true
  lastShownAt = Date.now()

  popupWindow = new BrowserWindow({
    width: 340,
    height: 220,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  popupWindow.loadFile(path.join(__dirname, 'popup.html'))

  popupWindow.webContents.once('did-finish-load', () => {
    popupWindow.webContents.send('set-word', {
      id: word.id,
      meaning: word.meaning,
      closeCorrectMs: settings.closeCorrectSec * 1000,
      closeWrongMs: settings.closeWrongSec * 1000,
    })
  })

  popupWindow.on('closed', () => {
    popupWindow = null
    isPopupOpen = false
    lastShownAt = Date.now()
  })
}

function openLessonPicker() {
  if (lessonPickerWindow) {
    lessonPickerWindow.focus()
    return
  }

  const height = Math.min(80 + allLessons.length * 38 + 52, 380)
  lessonPickerWindow = new BrowserWindow({
    width: 220,
    height,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  lessonPickerWindow.loadFile(path.join(__dirname, 'lesson-picker.html'))
  lessonPickerWindow.on('closed', () => { lessonPickerWindow = null })
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    width: 320,
    height: 240,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWindow.loadFile(path.join(__dirname, 'settings.html'))
  settingsWindow.on('closed', () => { settingsWindow = null })
}

ipcMain.handle('get-word', () => {
  const word = quiz.getNextWord()
  return word ? { id: word.id, meaning: word.meaning } : null
})

ipcMain.on('submit-answer', (event, { id, answer }) => {
  const result = quiz.checkAnswer(id, answer)
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.webContents.send('answer-result', result)
  }
})

ipcMain.on('dont-know', (event, { id }) => {
  quiz.recordResult(id, false)
  const word = quiz.words ? quiz.words.find((w) => w.id === id) : null
  const correctAnswer = word ? word.kana : ''
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.webContents.send('answer-result', { correct: false, correctAnswer })
  }
})

ipcMain.on('close-popup', () => {
  if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close()
})

ipcMain.handle('get-lessons-data', () => ({
  lessons: allLessons,
  selectedIds: settings.selectedLessonIds || [],
}))

ipcMain.on('save-lesson-selection', async (event, ids) => {
  settings.selectedLessonIds = ids
  settingsStore.save(settings)
  await loadVocabulary()
  if (lessonPickerWindow && !lessonPickerWindow.isDestroyed()) lessonPickerWindow.close()
})

ipcMain.on('close-lesson-picker', () => {
  if (lessonPickerWindow && !lessonPickerWindow.isDestroyed()) lessonPickerWindow.close()
})

ipcMain.handle('get-settings', () => settings)

ipcMain.on('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings }
  settingsStore.save(settings)
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

app.whenReady().then(async () => {
  settings = settingsStore.load()
  await loadVocabulary()

  const iconDir = app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'assets')
  iconActive = nativeImage.createFromPath(path.join(iconDir, 'tray-icon.png'))
  iconPaused = nativeImage.createFromPath(path.join(iconDir, 'tray-icon-paused.png'))
  tray = new Tray(iconActive)
  updateTray()

  lastShownAt = Date.now() - settings.intervalMin * 60 * 1000
  setInterval(() => {
    if (!isPaused && !isPopupOpen && Date.now() - lastShownAt >= settings.intervalMin * 60 * 1000) {
      createPopup()
    }
  }, TICK_MS)

  app.on('window-all-closed', (e) => e.preventDefault())
})
