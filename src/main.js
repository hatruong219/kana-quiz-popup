const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')

app.disableHardwareAcceleration()

if (process.platform === 'darwin') app.dock?.hide()

const quiz = require('./quiz')

let tray = null
let popupWindow = null
let isPopupOpen = false
let lastShownAt = 0

const INTERVAL_MS = 2 * 60 * 1000

function getWordsPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'words.json')
  }
  return path.join(app.getAppPath(), 'src', 'words.json')
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
    popupWindow.webContents.send('set-word', { id: word.id, meaning: word.meaning })
  })

  popupWindow.on('closed', () => {
    popupWindow = null
    isPopupOpen = false
    lastShownAt = Date.now()
  })
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
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close()
  }
})

app.whenReady().then(() => {
  quiz.load(getWordsPath())

  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  tray.setToolTip('Kana Quiz')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Kana Quiz', enabled: false },
      { type: 'separator' },
      { label: 'Quiz ngay', click: () => createPopup() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  )

  lastShownAt = Date.now() - INTERVAL_MS
  setInterval(() => {
    if (!isPopupOpen && Date.now() - lastShownAt >= INTERVAL_MS) {
      createPopup()
    }
  }, 30 * 1000)

  app.on('window-all-closed', (e) => e.preventDefault())
})
