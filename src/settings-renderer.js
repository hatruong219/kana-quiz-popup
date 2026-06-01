window.electronAPI.getSettings().then((s) => {
  document.getElementById('intervalMin').value = s.intervalMin
  document.getElementById('closeCorrectSec').value = s.closeCorrectSec
  document.getElementById('closeWrongSec').value = s.closeWrongSec
})

document.getElementById('save').addEventListener('click', () => {
  window.electronAPI.saveSettings({
    intervalMin: parseFloat(document.getElementById('intervalMin').value),
    closeCorrectSec: parseFloat(document.getElementById('closeCorrectSec').value),
    closeWrongSec: parseFloat(document.getElementById('closeWrongSec').value),
  })
})

document.getElementById('cancel').addEventListener('click', () => {
  window.electronAPI.closeSettings()
})

document.getElementById('close-win').addEventListener('click', () => {
  window.electronAPI.closeSettings()
})
