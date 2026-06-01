let currentId = null
const meaningEl = document.getElementById('meaning')
const answerEl = document.getElementById('answer')
const submitBtn = document.getElementById('submit')
const dontKnowBtn = document.getElementById('dont-know')
const feedbackEl = document.getElementById('feedback')
const closeBtn = document.getElementById('close-btn')

window.electronAPI.onSetWord(({ id, meaning }) => {
  currentId = id
  meaningEl.textContent = meaning
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
answerEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submit()
})

dontKnowBtn.addEventListener('click', () => {
  if (currentId === null) return
  window.electronAPI.dontKnow(currentId)
  submitBtn.disabled = true
  answerEl.disabled = true
  dontKnowBtn.disabled = true
})

window.electronAPI.onResult(({ correct, correctAnswer }) => {
  if (correct) {
    feedbackEl.textContent = '✓ Đúng rồi!'
    feedbackEl.className = 'correct'
    setTimeout(() => window.electronAPI.closePopup(), CLOSE_DELAY_CORRECT_MS)
  } else {
    feedbackEl.textContent = `✗ Đáp án: ${correctAnswer}`
    feedbackEl.className = 'wrong'
    closeBtn.style.display = 'block'
    setTimeout(() => window.electronAPI.closePopup(), CLOSE_DELAY_WRONG_MS)
  }
})

closeBtn.addEventListener('click', () => window.electronAPI.closePopup())
