let currentId = null
let closeCorrectMs = 1500
let closeWrongMs = 60 * 1000
const meaningEl = document.getElementById('meaning')
const answerEl = document.getElementById('answer')
const submitBtn = document.getElementById('submit')
const dontKnowBtn = document.getElementById('dont-know')
const feedbackEl = document.getElementById('feedback')
const closeBtn = document.getElementById('close-btn')

window.electronAPI.onSetWord(({ id, meaning, closeCorrectMs: ccMs, closeWrongMs: cwMs }) => {
  currentId = id
  meaningEl.textContent = meaning
  if (ccMs) closeCorrectMs = ccMs
  if (cwMs) closeWrongMs = cwMs
  answerEl.value = ''
  answerEl.focus()
})

function submit() {
  if (currentId === null) return
  window.electronAPI.submitAnswer(currentId, answerEl.value)
  submitBtn.disabled = true
  answerEl.disabled = true
}

submitBtn.addEventListener('click', submit)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return
  if (submitBtn.onclick) window.electronAPI.closePopup()
  else submit()
})

dontKnowBtn.addEventListener('click', () => {
  if (currentId === null) return
  window.electronAPI.dontKnow(currentId)
  submitBtn.disabled = true
  answerEl.disabled = true
  dontKnowBtn.disabled = true
})

window.electronAPI.onResult(({ correct, correctAnswer }) => {
  submitBtn.disabled = false
  submitBtn.onclick = () => window.electronAPI.closePopup()

  if (correct) {
    feedbackEl.textContent = '✓ Đúng rồi!'
    feedbackEl.className = 'correct'
    setTimeout(() => window.electronAPI.closePopup(), closeCorrectMs)
  } else {
    feedbackEl.textContent = `✗ Đáp án: ${correctAnswer}`
    feedbackEl.className = 'wrong'
    closeBtn.style.display = 'block'
    setTimeout(() => window.electronAPI.closePopup(), closeWrongMs)
  }
})

closeBtn.addEventListener('click', () => window.electronAPI.closePopup())
