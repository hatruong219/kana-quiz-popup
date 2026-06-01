const fs = require('fs')
const path = require('path')
const { app } = require('electron')

const DEFAULTS = {
  intervalMin: 1.5,
  closeCorrectSec: 1.5,
  closeWrongSec: 60,
  selectedLessonIds: [],
}

function getPath() {
  return path.join(app.getPath('userData'), 'settings.json')
}

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(getPath(), 'utf-8')) }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(settings) {
  fs.writeFileSync(getPath(), JSON.stringify(settings, null, 2))
}

module.exports = { load, save, DEFAULTS }
