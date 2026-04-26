const configured = typeof process !== 'undefined' && process.env && process.env.API_BASE ? String(process.env.API_BASE) : ''

let cachedBase: string | null = null

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u)
}

async function probeUrl(base: string, path = '/api/market', timeout = 2000) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const url = base ? `${base.replace(/\/$/, '')}${path}` : path
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    clearTimeout(id)
    return res.ok
  } catch (e) {
    return false
  }
}

async function ensureBase() {
  if (cachedBase !== null) return cachedBase

  // If caller passes a full URL path, we'll handle it per-call.
  // Candidate bases: explicit env, localhost, android emulator host, 127.0.0.1
  const candidates: string[] = []
  if (configured) candidates.push(configured.replace(/\/$/, ''))

  // On web, use relative paths
  if (typeof window !== 'undefined' && window.location) {
    candidates.push('')
  }

  candidates.push('http://localhost:3333')
  candidates.push('http://10.0.2.2:3333') // Android emulator
  candidates.push('http://127.0.0.1:3333')

  for (const c of candidates) {
    // try probing a lightweight endpoint
    const ok = await probeUrl(c)
    if (ok) {
      cachedBase = c
      return c
    }
  }

  // no base found; default to configured or localhost
  cachedBase = configured || 'http://localhost:3333'
  return cachedBase
}

export async function getJSON(path: string) {
  if (isAbsoluteUrl(path)) {
    const r = await fetch(path)
    if (!r.ok) throw new Error(`Fetch error ${r.status}`)
    return r.json()
  }
  const base = await ensureBase()
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch error ${res.status}`)
  return res.json()
}

export async function postJSON(path: string, body: any) {
  if (isAbsoluteUrl(path)) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!r.ok) throw new Error(`Post error ${r.status}`)
    return r.json()
  }
  const base = await ensureBase()
  const url = base ? `${base.replace(/\/$/, '')}${path}` : path
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Post error ${res.status}`)
  return res.json()
}
