const https = require('https')
const http = require('http')

const API_BASE = 'https://admin.truongha.com'

function get(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

async function fetchAll(lessonNumbers) {
  const qs = lessonNumbers && lessonNumbers.length > 0
    ? `?lessons=${lessonNumbers.join(',')}`
    : ''
  return get(`${API_BASE}/api/kana-quiz${qs}`)
}

module.exports = { fetchAll }
