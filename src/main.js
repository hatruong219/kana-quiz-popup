const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')

app.disableHardwareAcceleration()

if (process.platform === 'darwin') app.dock?.hide()

const quiz = require('./quiz')
const { TICK_MS } = require('./constants')
const settingsStore = require('./settings-store')

let tray = null
let popupWindow = null
let settingsWindow = null
let isPopupOpen = false
let isPaused = false
let lastShownAt = 0
let settings = {}
let iconActive = null
let iconPaused = null

function getWordsPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'words.json')
  }
  return path.join(app.getAppPath(), 'src', 'words.json')
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

ipcMain.handle('get-settings', () => settings)

ipcMain.on('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings }
  settingsStore.save(settings)
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})

app.whenReady().then(() => {
  settings = settingsStore.load()
  quiz.load(getWordsPath())

  iconActive = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray-icon.png'))
  iconPaused = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray-icon-paused.png'))
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
