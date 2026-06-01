let currentId = null
const meaningEl = document.getElementById('meaning')
const answerEl = document.getElementById('answer')
const submitBtn = document.getElementById('submit')
const dontKnowBtn = document.getElementById('dont-know')
const feedbackEl = document.getElementById('feedback')

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
  } else {
    feedbackEl.textContent = `✗ Đáp án: ${correctAnswer}`
    feedbackEl.className = 'wrong'
  }
  setTimeout(() => window.electronAPI.closePopup(), 1500)
})
