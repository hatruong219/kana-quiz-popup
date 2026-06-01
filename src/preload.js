const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onSetWord: (cb) => ipcRenderer.on('set-word', (e, data) => cb(data)),
  submitAnswer: (id, answer) => ipcRenderer.send('submit-answer', { id, answer }),
  dontKnow: (id) => ipcRenderer.send('dont-know', { id }),
  onResult: (cb) => ipcRenderer.on('answer-result', (e, data) => cb(data)),
  closePopup: () => ipcRenderer.send('close-popup'),
})
