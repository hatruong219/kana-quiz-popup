const lessonsEl = document.getElementById('lessons')

window.electronAPI.getLessonsData().then(({ lessons, selectedIds }) => {
  lessons.forEach((l) => {
    const checked = selectedIds.length === 0 || selectedIds.includes(l.lesson_number)
    const label = document.createElement('label')
    label.innerHTML = `<input type="checkbox" value="${l.lesson_number}" ${checked ? 'checked' : ''} /> Bài ${l.lesson_number}`
    lessonsEl.appendChild(label)
  })
})

document.getElementById('btn-ok').addEventListener('click', () => {
  const btn = document.getElementById('btn-ok')
  btn.innerHTML = '<span class="spinner"></span>'
  btn.disabled = true
  document.getElementById('btn-cancel').disabled = true
  const checked = [...document.querySelectorAll('#lessons input:checked')].map((el) => Number(el.value))
  const all = [...document.querySelectorAll('#lessons input')].length
  window.electronAPI.saveLessonSelection(checked.length === all ? [] : checked)
})

document.getElementById('btn-cancel').addEventListener('click', () => {
  window.electronAPI.closeLessonPicker()
})
