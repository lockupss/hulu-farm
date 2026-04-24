const http = require('http')
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '..', 'data')
const PORT = process.env.PORT || 3333

function readJSON(file) {
  try {
    const p = path.join(DATA_DIR, file)
    if (!fs.existsSync(p)) return null
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    console.error('readJSON error', e)
    return null
  }
}

function writeJSON(file, data) {
  try {
    const p = path.join(DATA_DIR, file)
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (e) {
    console.error('writeJSON error', e)
    return false
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = url.pathname

  if (req.method === 'GET' && pathname === '/api/forum') {
    const data = readJSON('forum.json') || []
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  if (req.method === 'POST' && pathname === '/api/forum') {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
        const existing = readJSON('forum_posts.json') || []
        const next = [payload, ...existing]
        writeJSON('forum_posts.json', next)
        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (e) {
        res.writeHead(400)
        res.end('invalid body')
      }
    })
    return
  }

  if (req.method === 'GET' && pathname === '/api/weather') {
    const data = readJSON('weather.json') || {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  if (req.method === 'GET' && pathname === '/api/market') {
    const data = readJSON('market.json') || {}
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const data = readJSON('notifications.json') || []
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
    return
  }

  // static serve small files (favicon or simple assets)
  if (req.method === 'GET' && pathname.startsWith('/static/')) {
    const filePath = path.join(DATA_DIR, pathname.replace('/static/', ''))
    if (fs.existsSync(filePath)) {
      const stream = fs.createReadStream(filePath)
      res.writeHead(200)
      stream.pipe(res)
      return
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not found')
})

server.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`))
