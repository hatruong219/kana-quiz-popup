const fs = require('fs')
const wanakana = require('wanakana')

let words = []
const stats = new Map() // id -> { correctCount, wrongCount }

function load(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  words = JSON.parse(raw)
}

function getWeight(word) {
  const s = stats.get(word.id)
  if (!s) return 10
  return Math.max(1, 10 + s.wrongCount * 3 - s.correctCount * 3)
}

function getNextWord() {
  const totalWeight = words.reduce((sum, w) => sum + getWeight(w), 0)
  let r = Math.random() * totalWeight
  for (const word of words) {
    r -= getWeight(word)
    if (r <= 0) return word
  }
  return words[words.length - 1]
}

function checkAnswer(id, userInput) {
  const word = words.find((w) => w.id === id)
  if (!word) return { correct: false, correctAnswer: '' }

  const normalize = (str) => wanakana.toHiragana(str.trim().toLowerCase())
  const correct = normalize(userInput) === normalize(word.kana)

  recordResult(id, correct)
  return { correct, correctAnswer: word.kana }
}

function recordResult(id, correct) {
  const s = stats.get(id) || { correctCount: 0, wrongCount: 0 }
  if (correct) {
    s.correctCount++
    s.wrongCount = 0
  } else {
    s.wrongCount++
  }
  stats.set(id, s)
}

module.exports = { load, getNextWord, checkAnswer, recordResult, get words() { return words } }
