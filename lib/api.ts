const API_BASE = process.env.API_BASE || 'http://localhost:3333'

export async function getJSON(path: string) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`Fetch error ${res.status}`)
  return res.json()
}

export async function postJSON(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Post error ${res.status}`)
  return res.json()
}
