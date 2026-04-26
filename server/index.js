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

function normalizePosts(posts) {
  if (!Array.isArray(posts)) return []
  const map = new Map()
  const normalizeReply = (r, parentPostId) => {
    r.replies = Array.isArray(r.replies) ? r.replies : []
    r.liked_by = Array.isArray(r.liked_by) ? r.liked_by : []
    // ensure postId or parentPostId
    r.postId = r.postId || parentPostId
    r.likes = r.likes || r.liked_by.length || 0
    r.replies.forEach(rr => normalizeReply(rr, parentPostId))
  }

  // Merge posts by id: union liked_by and concat replies
  posts.forEach(p => {
    const id = String(p.id)
    const existing = map.get(id)
    if (!existing) {
      const copy = Object.assign({ replies: [], likes: 0, liked_by: [] }, p)
      copy.replies = Array.isArray(copy.replies) ? copy.replies : []
      copy.liked_by = Array.isArray(copy.liked_by) ? copy.liked_by : []
      map.set(id, copy)
    } else {
      // merge fields: prefer existing values but merge arrays
      existing.replies = (existing.replies || []).concat(p.replies || [])
      existing.liked_by = Array.from(new Set([...(existing.liked_by || []), ...(p.liked_by || [])]))
      existing.likes = existing.liked_by.length || existing.likes || 0
      // keep other fields from existing
    }
  })

  const res = []
  for (const post of map.values()) {
    post.replies = Array.isArray(post.replies) ? post.replies : []
    post.liked_by = Array.isArray(post.liked_by) ? post.liked_by : []
    post.likes = post.likes || post.liked_by.length || 0
    post.replies.forEach(r => normalizeReply(r, post.id))
    res.push(post)
  }
  return res
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
    // Merge static forum.json (seed) with persisted forum_posts.json (user posts)
    const seed = readJSON('forum.json') || []
    const posts = readJSON('forum_posts.json') || []
    // prefer persisted posts first, then seed; dedupe by id
    const map = new Map()
    ;(posts || []).forEach(p => map.set(String(p.id), p))
    ;(seed || []).forEach(p => { if (!map.has(String(p.id))) map.set(String(p.id), p) })
    const data = normalizePosts(Array.from(map.values()))
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
        // normalize post shape for persistence
  const post = Object.assign({ replies: [], likes: 0, liked_by: [], category: 'General' }, payload)
  // ensure time fields
  post.time = post.time || new Date().toISOString()
  post.timestamp = post.timestamp || Date.now()
        // handle attachments if present: write base64 blobs to data/uploads
        if (Array.isArray(post.attachments) && post.attachments.length) {
          const uploadsDir = path.join(DATA_DIR, 'uploads')
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
          post.attachments = post.attachments.map(a => {
            try {
              if (a.data && a.name) {
                const name = `${Date.now()}-${a.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
                const p = path.join(uploadsDir, name)
                const buf = Buffer.from(a.data, 'base64')
                fs.writeFileSync(p, buf)
                // return a public static path
                return { name: a.name, url: `/static/uploads/${name}`, mime: a.mime || null }
              }
            } catch (e) {
              console.error('attachment write error', e)
            }
            return null
          }).filter(Boolean)
        }
        const existing = readJSON('forum_posts.json') || []
        // avoid duplicate post ids: if exists, replace, else prepend
        const idx = existing.findIndex(p => String(p.id) === String(post.id))
        if (idx !== -1) existing.splice(idx, 1)
        const next = normalizePosts([post, ...existing])
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

  // Add a reply to a post: POST /api/forum/:id/reply
  if (req.method === 'POST' && pathname.match(/^\/api\/forum\/[0-9]+\/reply$/)) {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)
  const id = Number(pathname.split('/')[3])
  const posts = normalizePosts(readJSON('forum_posts.json') || [])
        const idx = posts.findIndex(p => Number(p.id) === id)
  if (idx === -1) {
          // not found in persisted posts, try seed
          const seed = readJSON('forum.json') || []
          const sidx = seed.findIndex(p => Number(p.id) === id)
          if (sidx === -1) {
            res.writeHead(404)
            res.end('post not found')
            return
          }
          // move seed post into persisted posts with replies
          const sp = Object.assign({ replies: [], likes: seed[sidx].likes || 0, liked_by: [], category: seed[sidx].category || 'General' }, seed[sidx])
          posts.unshift(sp)
          writeJSON('forum_posts.json', posts)
          // idx is 0
          posts[0].replies = posts[0].replies || []
          posts[0].replies.unshift(payload)
          writeJSON('forum_posts.json', posts)
          res.writeHead(201, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true }))
          return
        }
  posts[idx].replies = posts[idx].replies || []
        // support nested replies: payload may include parentReplyId
        // handle attachments for replies as well
        if (Array.isArray(payload.attachments) && payload.attachments.length) {
          const uploadsDir = path.join(DATA_DIR, 'uploads')
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
          payload.attachments = payload.attachments.map(a => {
            try {
              if (a.data && a.name) {
                const name = `${Date.now()}-${a.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
                const p = path.join(uploadsDir, name)
                const buf = Buffer.from(a.data, 'base64')
                fs.writeFileSync(p, buf)
                return { name: a.name, url: `/static/uploads/${name}`, mime: a.mime || null }
              }
            } catch (e) { console.error('attachment write error', e) }
            return null
          }).filter(Boolean)
        }

        if (payload.parentReplyId) {
          // find the parent reply and push into its replies array
          const parentId = Number(payload.parentReplyId)
          const findReplyRec = (replies) => {
            for (let r of replies) {
              if (Number(r.id) === parentId) return r
              if (r.replies) {
                const found = findReplyRec(r.replies)
                if (found) return found
              }
            }
            return null
          }
          const parent = findReplyRec(posts[idx].replies)
            if (parent) {
            parent.replies = parent.replies || []
            // ensure reply has postId and liked_by
      payload.postId = id
      payload.time = payload.time || new Date().toISOString()
      payload.timestamp = payload.timestamp || Date.now()
            payload.liked_by = payload.liked_by || []
            payload.likes = payload.likes || payload.liked_by.length || 0
            parent.replies.unshift(payload)
          } else {
            // fallback to top-level replies
            payload.postId = id
            payload.liked_by = payload.liked_by || []
            payload.likes = payload.likes || payload.liked_by.length || 0
            posts[idx].replies.unshift(payload)
          }
        } else {
          payload.postId = id
          payload.liked_by = payload.liked_by || []
          payload.likes = payload.likes || payload.liked_by.length || 0
          posts[idx].replies.unshift(payload)
        }
        // normalize before write
        const normalized = normalizePosts(posts)
        writeJSON('forum_posts.json', normalized)
        res.writeHead(201, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true }))
      } catch (e) {
        res.writeHead(400)
        res.end('invalid body')
      }
    })
    return
  }

  // Like a post: POST /api/forum/:id/like
  if (req.method === 'POST' && pathname.match(/^\/api\/forum\/[0-9]+\/like$/)) {
    let body = ''
    req.on('data', chunk => (body += chunk))
    req.on('end', () => {
      try {
  const id = Number(pathname.split('/')[3])
  const posts = normalizePosts(readJSON('forum_posts.json') || [])
        const idx = posts.findIndex(p => Number(p.id) === id)
        if (idx === -1) {
          res.writeHead(404)
          res.end('post not found')
          return
        }
        const bodyObj = body ? JSON.parse(body) : {}
        const userId = bodyObj.userId || null
        const replyId = bodyObj.replyId ? Number(bodyObj.replyId) : null

        // helper to find a reply recursively
        const findReplyRec = (replies, rid) => {
          if (!replies) return null
          for (let r of replies) {
            if (Number(r.id) === rid) return r
            if (r.replies) {
              const found = findReplyRec(r.replies, rid)
              if (found) return found
            }
          }
          return null
        }

        if (replyId) {
          // like a reply
          const reply = findReplyRec(posts[idx].replies, replyId)
          if (!reply) {
            res.writeHead(404)
            res.end('reply not found')
            return
          }
          reply.liked_by = Array.isArray(reply.liked_by) ? reply.liked_by : []
          let liked = false
          if (!userId) {
            // anonymous: add a pseudo-id
            const anonId = `anon-${Date.now()}-${Math.floor(Math.random()*100000)}`
            reply.liked_by.push(anonId)
            liked = true
          } else {
            const s = new Set(reply.liked_by)
            if (s.has(userId)) {
              s.delete(userId)
              liked = false
            } else {
              s.add(userId)
              liked = true
            }
            reply.liked_by = Array.from(s)
          }
          reply.likes = reply.liked_by.length
          const normalized = normalizePosts(posts)
          writeJSON('forum_posts.json', normalized)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, likes: reply.likes, liked }))
          return
        }

        // like a top-level post
        posts[idx].liked_by = Array.isArray(posts[idx].liked_by) ? posts[idx].liked_by : []
        let likedTop = false
        if (!userId) {
          const anonId = `anon-${Date.now()}-${Math.floor(Math.random()*100000)}`
          posts[idx].liked_by.push(anonId)
          likedTop = true
        } else {
          const s = new Set(posts[idx].liked_by)
          if (s.has(userId)) {
            s.delete(userId)
            likedTop = false
          } else {
            s.add(userId)
            likedTop = true
          }
          posts[idx].liked_by = Array.from(s)
        }
        posts[idx].likes = posts[idx].liked_by.length
        const normalizedTop = normalizePosts(posts)
        writeJSON('forum_posts.json', normalizedTop)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ success: true, likes: posts[idx].likes, liked: likedTop }))
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

  if (req.method === 'GET' && pathname === '/api/weather/alerts') {
    const alerts = readJSON('alerts.json') || []
    const lat = url.searchParams.get('lat') ? Number(url.searchParams.get('lat')) : null
    const lon = url.searchParams.get('lon') ? Number(url.searchParams.get('lon')) : null
    if (lat != null && lon != null) {
      // filter alerts by radius
      const haversineKm = (aLat, aLon, bLat, bLon) => {
        const toRad = d => d * Math.PI / 180
        const R = 6371
        const dLat = toRad(bLat - aLat)
        const dLon = toRad(bLon - aLon)
        const lat1 = toRad(aLat)
        const lat2 = toRad(bLat)
        const h = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
        return 2 * R * Math.asin(Math.sqrt(h))
      }
      const nearby = alerts.filter(a => {
        if (typeof a.lat !== 'number' || typeof a.lon !== 'number') return true
        const d = haversineKm(lat, lon, a.lat, a.lon)
        return d <= (a.radius_km || 300)
      })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(nearby))
      return
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(alerts))
    return
  }

  if (req.method === 'GET' && pathname === '/api/market') {
    // Support optional country-specific market files.
    // Query param: ?country=ET or ?country=Ethiopia
    const country = url.searchParams.get('country') || null
    const acceptLang = req.headers['accept-language'] || ''

    // helper - try several candidate filenames for country
    function tryMarketForCountry(c) {
      if (!c) return null
      const cand = []
      const u = String(c)
      // alpha-2 / alpha-3 and normalized
      cand.push(`market.${u}.json`)
      cand.push(`market_${u}.json`)
      cand.push(`markets/${u}.json`)
      cand.push(`markets/${u.toLowerCase()}.json`)
      cand.push(`markets/${u.toUpperCase()}.json`)
      // spaces/commas replaced
      const slug = u.replace(/[^a-zA-Z0-9]/g, '_')
      cand.push(`markets/${slug}.json`)
      for (const f of cand) {
        const v = readJSON(f)
        if (v) return v
      }
      return null
    }

    // Prefer explicit ?country param
    let result = null
    if (country) result = tryMarketForCountry(country)

    // fallback to accept-language first region (e.g., en-US -> US)
    if (!result && acceptLang) {
      const m = String(acceptLang).split(',')[0]
      const parts = m.split('-')
      if (parts.length > 1) result = tryMarketForCountry(parts[1])
      if (!result) result = tryMarketForCountry(parts[0])
    }

    // final fallback to default market.json
    if (!result) result = readJSON('market.json') || {}

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
    return
  }

  if (req.method === 'GET' && pathname === '/api/notifications') {
    const data = readJSON('notifications.json') || []
    // optional prefs query param: URL-encoded JSON array or comma-separated list
    const prefsRaw = url.searchParams.get('prefs') || ''
    let enabledPrefs = []
    try {
      if (prefsRaw) {
        if (prefsRaw.startsWith('[')) enabledPrefs = JSON.parse(prefsRaw)
        else enabledPrefs = prefsRaw.split(',').map(s => decodeURIComponent(s).trim()).filter(Boolean)
      }
    } catch (e) {
      enabledPrefs = []
    }

    // mapping of preference label to keywords to match in notification text/title/message
    const prefKeywords = {
      'Weather Alerts': ['weather', 'rain', 'flood', 'storm'],
      'Price Updates': ['price', 'market', 'maize', 'wheat', 'teff', 'price'],
      'Disease Alerts': ['disease', 'pest', 'blight', 'armyworm'],
      'Community Posts': ['forum', 'community', 'post'],
      'Farm Reminders': ['harvest', 'reminder', 'planting', 'schedule']
    }

    let filtered = data
    if (enabledPrefs && enabledPrefs.length) {
      // create keyword set from enabled prefs
      const kws = new Set()
      for (const p of enabledPrefs) {
        const k = prefKeywords[p]
        if (k && Array.isArray(k)) k.forEach(x => kws.add(x))
      }
      if (kws.size > 0) {
        filtered = data.filter(n => {
          const text = String(n.text || n.message || n.title || '').toLowerCase()
          for (const kw of kws) if (text.includes(kw)) return true
          return false
        })
      } else {
        // If enabledPrefs provided but none matched known labels, fall back to empty
        filtered = []
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(filtered))
    return
  }

  // static serve small files (favicon or simple assets)
  if (req.method === 'GET' && pathname.startsWith('/static/')) {
    const filePath = path.join(DATA_DIR, pathname.replace('/static/', ''))
    // special mapping: /static/uploads -> data/uploads
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
