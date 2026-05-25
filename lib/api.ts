import Constants from 'expo-constants'

import { getApiLanguage } from './api-lang'

function withLang(path: string): string {
  if (!path.startsWith('/') || path.includes('lang=')) return path
  const lang = getApiLanguage()
  if (!lang || lang === 'en') return path
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}lang=${encodeURIComponent(lang)}`
}

const configured =
  typeof process !== 'undefined' && process.env && process.env.API_BASE ? String(process.env.API_BASE) : ''

function envPublicBase(): string {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE) {
    return String(process.env.EXPO_PUBLIC_API_BASE).replace(/\/$/, '')
  }
  return ''
}

/** When using Expo Go on a phone, Metro’s host is your PC’s LAN IP — reuse it for the Node API port. */
function inferLanApiBase(): string | null {
  try {
    const uri =
      Constants.expoConfig?.hostUri ??
      (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
      (Constants as { manifest2?: { extra?: { expoClient?: { debuggerHost?: string } } } }).manifest2?.extra?.expoClient
        ?.debuggerHost
    if (!uri || typeof uri !== 'string') return null
    const host = uri.split(':')[0]
    if (!host || host === 'localhost' || host === '127.0.0.1') return null
    return `http://${host}:3333`
  } catch {
    return null
  }
}

let cachedBase: string | null = null

/** Call after changing EXPO_PUBLIC_API_BASE or when switching networks (e.g. dev menu). */
export function resetApiBaseCache() {
  cachedBase = null
}

function isAbsoluteUrl(u: string) {
  return /^https?:\/\//i.test(u)
}

async function probeUrl(base: string, path = '/api/health', timeout = 3500) {
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    const url = base ? `${base.replace(/\/$/, '')}${path}` : path
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    clearTimeout(id)
    return res.ok
  } catch {
    return false
  }
}

async function ensureBase() {
  if (cachedBase !== null) return cachedBase

  const candidates: string[] = []

  const pub = envPublicBase()
  if (pub) candidates.push(pub)

  if (configured) candidates.push(configured.replace(/\/$/, ''))

  const lan = inferLanApiBase()
  if (lan) candidates.push(lan)

  // On web, try same origin first (if you proxy /api to the Node server).
  if (typeof window !== 'undefined' && window.location) {
    candidates.push('')
  }

  candidates.push('http://localhost:3333')
  candidates.push('http://10.0.2.2:3333') // Android emulator → host loopback
  candidates.push('http://127.0.0.1:3333')

  const tried = new Set<string>()
  for (const c of candidates) {
    if (tried.has(c)) continue
    tried.add(c)
    const ok = await probeUrl(c)
    if (ok) {
      cachedBase = c
      return c
    }
  }

  cachedBase = configured || envPublicBase() || lan || 'http://localhost:3333'
  return cachedBase
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const text = await res.text()
    if (!text) return res.statusText || String(res.status)
    try {
      const j = JSON.parse(text)
      return String(j.error || j.message || text)
    } catch {
      return text.slice(0, 200)
    }
  } catch {
    return res.statusText || String(res.status)
  }
}

export async function getJSON(path: string, token?: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (isAbsoluteUrl(path)) {
    const r = await fetch(path, { headers })
    if (!r.ok) throw new Error(`Fetch error ${r.status}: ${await parseErrorDetail(r)}`)
    return r.json()
  }
  const base = await ensureBase()
  const pathWithLang = withLang(path)
  const url = base ? `${base.replace(/\/$/, '')}${pathWithLang}` : pathWithLang
  let res: Response
  try {
    res = await fetch(url, { headers })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`network: ${msg}`)
  }
  if (!res.ok) throw new Error(`Fetch error ${res.status}: ${await parseErrorDetail(res)}`)
  return res.json()
}

export async function postJSON(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (isAbsoluteUrl(path)) {
    const r = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
    if (!r.ok) throw new Error(`Post error ${r.status}: ${await parseErrorDetail(r)}`)
    return r.json()
  }
  const base = await ensureBase()
  const pathWithLang = withLang(path)
  const url = base ? `${base.replace(/\/$/, '')}${pathWithLang}` : pathWithLang
  let res: Response
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`network: ${msg}`)
  }
  if (!res.ok) throw new Error(`Post error ${res.status}: ${await parseErrorDetail(res)}`)
  return res.json()
}

export async function patchJSON(path: string, body: unknown, token: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const base = await ensureBase()
  const pathWithLang = withLang(path)
  const url = base ? `${base.replace(/\/$/, '')}${pathWithLang}` : pathWithLang
  let res: Response
  try {
    res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`network: ${msg}`)
  }
  if (!res.ok) throw new Error(`Patch error ${res.status}: ${await parseErrorDetail(res)}`)
  return res.json()
}

export async function deleteJSON(path: string, token: string | null) {
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const base = await ensureBase()
  const pathWithLang = withLang(path)
  const url = base ? `${base.replace(/\/$/, '')}${pathWithLang}` : pathWithLang
  let res: Response
  try {
    res = await fetch(url, { method: 'DELETE', headers })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`network: ${msg}`)
  }
  if (!res.ok) throw new Error(`Delete error ${res.status}: ${await parseErrorDetail(res)}`)
  return res.json()
}

/** Resolve `/static/...` paths from the API server for Image URIs. */
export async function resolveMediaUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null
  if (isAbsoluteUrl(pathOrUrl) || pathOrUrl.startsWith('data:')) return pathOrUrl
  const base = await ensureBase()
  if (!base) return pathOrUrl
  const p = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${base.replace(/\/$/, '')}${p}`
}
