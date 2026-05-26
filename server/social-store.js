const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 120000, 64, 'sha512').toString('hex')
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex')
}

function publicUser(u) {
  if (!u) return null
  return {
    id: u.id,
    displayName: u.displayName,
    bio: u.bio || '',
    avatarUrl: u.avatarUrl || null,
    locationLabel: u.locationLabel || null,
  }
}

function gridKey(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return null
  return `${lat.toFixed(1)}_${lng.toFixed(1)}`
}

function createSocialApi({ DATA_DIR, readJSON, writeJSON }) {
  function loadUsers() {
    const raw = readJSON('users.json')
    if (raw && Array.isArray(raw.users)) return raw.users
    return []
  }

  function saveUsers(users) {
    return writeJSON('users.json', { users })
  }

  function loadSessions() {
    const raw = readJSON('sessions.json')
    if (raw && Array.isArray(raw.sessions)) return raw.sessions
    return []
  }

  function saveSessions(sessions) {
    writeJSON('sessions.json', { sessions })
  }

  function loadFollows() {
    const raw = readJSON('follows.json')
    if (raw && Array.isArray(raw.follows)) return raw.follows
    return []
  }

  function saveFollows(follows) {
    writeJSON('follows.json', { follows })
  }

  function loadChat() {
    const raw = readJSON('chat.json')
    if (raw && raw.threads && typeof raw.threads === 'object') return raw
    return { threads: {} }
  }

  function saveChat(data) {
    writeJSON('chat.json', data)
  }

  function getBearerUserId(req) {
    const h = req.headers.authorization || req.headers.Authorization
    if (!h || typeof h !== 'string' || !h.startsWith('Bearer ')) return null
    const token = h.slice(7).trim()
    if (!token) return null
    const sessions = loadSessions()
    const s = sessions.find((x) => x.token === token)
    return s ? s.userId : null
  }

  function findUserById(id) {
    return loadUsers().find((u) => String(u.id) === String(id))
  }

  function findUserByEmail(email) {
    const e = String(email || '').trim().toLowerCase()
    return loadUsers().find((u) => u.email === e)
  }

  function writeAvatarFile(base64, name) {
    const uploadsDir = path.join(DATA_DIR, 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
    const safe = `${Date.now()}-${String(name || 'avatar.jpg').replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const p = path.join(uploadsDir, safe)
    const buf = Buffer.from(base64, 'base64')
    fs.writeFileSync(p, buf)
    return `/static/uploads/${safe}`
  }

  function followingSet(userId) {
    const follows = loadFollows()
    const set = new Set()
    for (const f of follows) {
      if (String(f.from) === String(userId)) set.add(String(f.to))
    }
    return set
  }

  function followersSet(userId) {
    const follows = loadFollows()
    const set = new Set()
    for (const f of follows) {
      if (String(f.to) === String(userId)) set.add(String(f.from))
    }
    return set
  }

  function mutualFriendCount(a, b) {
    const fa = followingSet(a)
    const fb = followingSet(b)
    let n = 0
    for (const x of fa) {
      if (fb.has(x)) n++
    }
    return n
  }

  function threadIdForPair(u1, u2) {
    const ids = [String(u1), String(u2)].sort()
    return `${ids[0]}:${ids[1]}`
  }

  function json(res, code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(obj))
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let body = ''
      req.on('data', (c) => (body += c))
      req.on('end', () => resolve(body))
      req.on('error', reject)
    })
  }

  async function handle(req, res, url) {
    const pathname = url.pathname
    const method = req.method

    if (method === 'POST' && pathname === '/api/auth/register') {
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const email = String(payload.email || '').trim().toLowerCase()
        const password = String(payload.password || '')
        const displayName = String(payload.displayName || '').trim()
        if (!email || !password || !displayName) {
          json(res, 400, { error: 'email_password_displayName_required' })
          return true
        }
        if (findUserByEmail(email)) {
          json(res, 409, { error: 'email_in_use' })
          return true
        }
        const salt = crypto.randomBytes(16).toString('hex')
        const id = `u-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        const user = {
          id,
          email,
          passwordHash: hashPassword(password, salt),
          salt,
          displayName,
          bio: '',
          avatarUrl: null,
          lat: null,
          lng: null,
          locationLabel: null,
          contactHashes: [],
          createdAt: Date.now(),
        }
        const users = loadUsers()
        users.push(user)
        if (!saveUsers(users)) {
          json(res, 500, { error: 'persist_failed' })
          return true
        }
        const token = randomToken()
        const sessions = loadSessions()
        sessions.push({ token, userId: id, createdAt: Date.now() })
        saveSessions(sessions)
        json(res, 201, { token, user: publicUser(user) })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'POST' && pathname === '/api/auth/login') {
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const email = String(payload.email || '').trim().toLowerCase()
        const password = String(payload.password || '')
        const user = findUserByEmail(email)
        if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
          json(res, 401, { error: 'invalid_credentials' })
          return true
        }
        const token = randomToken()
        const sessions = loadSessions()
        sessions.push({ token, userId: user.id, createdAt: Date.now() })
        saveSessions(sessions)
        json(res, 200, { token, user: publicUser(user) })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'POST' && pathname === '/api/auth/logout') {
      const uid = getBearerUserId(req)
      const h = req.headers.authorization || req.headers.Authorization
      const token = h && h.startsWith('Bearer ') ? h.slice(7).trim() : null
      if (uid && token) {
        const sessions = loadSessions().filter((s) => s.token !== token)
        saveSessions(sessions)
      }
      json(res, 200, { success: true })
      return true
    }

    if (method === 'GET' && pathname === '/api/auth/me') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const user = findUserById(uid)
      if (!user) {
        json(res, 404, { error: 'not_found' })
        return true
      }
      json(res, 200, { user: { ...publicUser(user), email: user.email } })
      return true
    }

    if (method === 'GET' && pathname.startsWith('/api/users/') && pathname !== '/api/users/me') {
      const parts = pathname.split('/')
      const id = parts[3]
      if (!id || id === 'me') return false
      const user = findUserById(id)
      if (!user) {
        json(res, 404, { error: 'not_found' })
        return true
      }
      const me = getBearerUserId(req)
      const following = me ? followingSet(me).has(String(user.id)) : false
      json(res, 200, { user: publicUser(user), following, mutualFriends: me ? mutualFriendCount(me, user.id) : 0 })
      return true
    }

    if (method === 'PATCH' && pathname === '/api/users/me') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const users = loadUsers()
        const idx = users.findIndex((u) => u.id === uid)
        if (idx === -1) {
          json(res, 404, { error: 'not_found' })
          return true
        }
        const u = users[idx]
        if (typeof payload.displayName === 'string' && payload.displayName.trim()) u.displayName = payload.displayName.trim()
        if (typeof payload.bio === 'string') u.bio = payload.bio.slice(0, 500)
        if (typeof payload.locationLabel === 'string') u.locationLabel = payload.locationLabel.slice(0, 120)
        if (payload.avatar && payload.avatar.data && payload.avatar.name) {
          try {
            u.avatarUrl = writeAvatarFile(payload.avatar.data, payload.avatar.name)
          } catch (e) {
            console.error('avatar error', e)
          }
        }
        if (payload.clearAvatar) u.avatarUrl = null
        users[idx] = u
        saveUsers(users)
        json(res, 200, { user: { ...publicUser(u), email: u.email } })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'POST' && pathname === '/api/users/me/sync') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const users = loadUsers()
        const idx = users.findIndex((u) => u.id === uid)
        if (idx === -1) {
          json(res, 404, { error: 'not_found' })
          return true
        }
        const u = users[idx]
        if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
          u.lat = payload.lat
          u.lng = payload.lng
        }
        if (Array.isArray(payload.contactHashes)) {
          u.contactHashes = [...new Set(payload.contactHashes.map((x) => String(x)).filter(Boolean))].slice(0, 2000)
        }
        users[idx] = u
        saveUsers(users)
        json(res, 200, { success: true })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'GET' && pathname === '/api/suggestions') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const me = findUserById(uid)
      if (!me) {
        json(res, 404, { error: 'not_found' })
        return true
      }
      const myFollowing = followingSet(uid)
      const myHashes = new Set(me.contactHashes || [])
      const myGrid = gridKey(me.lat, me.lng)
      const users = loadUsers()
      const scored = []
      for (const c of users) {
        if (c.id === uid) continue
        if (myFollowing.has(String(c.id))) continue
        let score = 0
        const reasons = []
        const cg = gridKey(c.lat, c.lng)
        if (myGrid && cg && myGrid === cg) {
          score += 4
          reasons.push('near_you')
        }
        const mutual = mutualFriendCount(uid, c.id)
        if (mutual > 0) {
          score += mutual * 5
          reasons.push(`mutual_${mutual}`)
        }
        let contactOverlap = 0
        for (const h of c.contactHashes || []) {
          if (myHashes.has(h)) contactOverlap++
        }
        if (contactOverlap > 0) {
          score += Math.min(12, contactOverlap * 4)
          reasons.push('contacts')
        }
        if (score > 0) scored.push({ user: publicUser(c), score, reasons })
      }
      scored.sort((a, b) => b.score - a.score)
      json(res, 200, { suggestions: scored.slice(0, 24) })
      return true
    }

    if (method === 'POST' && pathname === '/api/social/follow') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const target = String(payload.userId || '')
        if (!target || target === uid) {
          json(res, 400, { error: 'bad_target' })
          return true
        }
        if (!findUserById(target)) {
          json(res, 404, { error: 'not_found' })
          return true
        }
        const follows = loadFollows()
        const exists = follows.some((f) => String(f.from) === uid && String(f.to) === target)
        if (!exists) follows.push({ from: uid, to: target, at: Date.now() })
        saveFollows(follows)
        json(res, 200, { success: true })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'DELETE' && pathname.startsWith('/api/social/follow/')) {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const target = pathname.split('/').pop()
      const follows = loadFollows().filter((f) => !(String(f.from) === uid && String(f.to) === String(target)))
      saveFollows(follows)
      json(res, 200, { success: true })
      return true
    }

    if (method === 'GET' && pathname === '/api/inbox') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const chat = loadChat()
      const threads = []
      for (const tid of Object.keys(chat.threads || {})) {
        if (!tid.includes(':')) continue
        const [a, b] = tid.split(':')
        if (a !== uid && b !== uid) continue
        const other = a === uid ? b : a
        const tdata = chat.threads[tid]
        const msgs = tdata.messages || []
        const last = msgs[msgs.length - 1]
        const ou = findUserById(other)
        threads.push({
          threadId: tid,
          otherUserId: other,
          other: publicUser(ou),
          lastMessage: last || null,
        })
      }
      threads.sort((x, y) => {
        const tx = x.lastMessage ? new Date(x.lastMessage.time).getTime() : 0
        const ty = y.lastMessage ? new Date(y.lastMessage.time).getTime() : 0
        return ty - tx
      })
      json(res, 200, { threads })
      return true
    }

    if (method === 'POST' && pathname === '/api/chat/open') {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const other = String(payload.otherUserId || '')
        if (!other || other === uid) {
          json(res, 400, { error: 'bad_target' })
          return true
        }
        if (!findUserById(other)) {
          json(res, 404, { error: 'not_found' })
          return true
        }
        const tid = threadIdForPair(uid, other)
        const chat = loadChat()
        if (!chat.threads[tid]) chat.threads[tid] = { messages: [] }
        saveChat(chat)
        json(res, 200, { threadId: tid, otherUserId: other })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    if (method === 'GET' && pathname.match(/^\/api\/chat\/[^/]+\/messages$/)) {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const tid = pathname.split('/')[3]
      if (!tid || !tid.includes(':')) {
        json(res, 400, { error: 'bad_thread' })
        return true
      }
      const [a, b] = tid.split(':')
      if (a !== uid && b !== uid) {
        json(res, 403, { error: 'forbidden' })
        return true
      }
      const chat = loadChat()
      const tdata = chat.threads[tid] || { messages: [] }
      json(res, 200, { messages: tdata.messages || [] })
      return true
    }

    if (method === 'POST' && pathname.match(/^\/api\/chat\/[^/]+\/messages$/)) {
      const uid = getBearerUserId(req)
      if (!uid) {
        json(res, 401, { error: 'unauthorized' })
        return true
      }
      const tid = pathname.split('/')[3]
      if (!tid || !tid.includes(':')) {
        json(res, 400, { error: 'bad_thread' })
        return true
      }
      const [a, b] = tid.split(':')
      if (a !== uid && b !== uid) {
        json(res, 403, { error: 'forbidden' })
        return true
      }
      const body = await readBody(req)
      try {
        const payload = JSON.parse(body || '{}')
        const text = String(payload.text || '').trim()
        if (!text) {
          json(res, 400, { error: 'empty' })
          return true
        }
        const chat = loadChat()
        if (!chat.threads[tid]) chat.threads[tid] = { messages: [] }
        const msg = {
          id: `m-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          from: uid,
          text: text.slice(0, 4000),
          time: new Date().toISOString(),
        }
        chat.threads[tid].messages.push(msg)
        saveChat(chat)
        json(res, 201, { message: msg })
      } catch (e) {
        json(res, 400, { error: 'invalid_body' })
      }
      return true
    }

    return false
  }

  return { getBearerUserId, findUserById, publicUser, handle, readBody }
}

module.exports = { createSocialApi }
