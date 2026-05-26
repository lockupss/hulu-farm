import { loadItem, saveItem } from './storage'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const REVERSE = 'https://geocoding-api.open-meteo.com/v1/reverse'

export async function fetchWeather(lat: number, lon: number) {
  // try cache first (if recent and same coords)
  try {
    const cache = await loadItem('last_weather')
    if (cache && cache.timestamp && Math.abs(Date.now() - cache.timestamp) < 1000 * 60 * 2) {
      // if cache is recent (2 min) and close to coordinates, return it
      const dLat = Math.abs(cache.lat - lat)
      const dLon = Math.abs(cache.lon - lon)
      if (dLat < 0.01 && dLon < 0.01) return cache.data
    }
  } catch (e) {
    // ignore
  }

  const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,visibility,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather API error')
  const data = await res.json()

  // reverse geocode for human readable location
  let place = null
  try {
    const r = await fetch(`${REVERSE}?latitude=${lat}&longitude=${lon}&count=1`)
    if (r.ok) {
      const rd = await r.json()
      if (rd && rd.results && rd.results[0]) place = rd.results[0].name || rd.results[0].country || null
    }
  } catch (e) {
    // ignore
  }

  // Synthesize current_weather object to maintain backward compatibility with components using current_weather properties
  const current_weather = {
    temperature: data.current?.temperature_2m,
    windspeed: data.current?.wind_speed_10m,
    weathercode: data.current?.weather_code,
    relativehumidity: data.current?.relative_humidity_2m,
    pressure: data.current?.pressure_msl ? `${Math.round(data.current.pressure_msl)} hPa` : null,
    visibility: data.current?.visibility ? (data.current.visibility >= 1000 ? `${Math.round(data.current.visibility / 1000)} km` : `${Math.round(data.current.visibility)} m`) : null,
  }

  const payload = {
    data: {
      ...data,
      current_weather
    },
    place,
    fetchedAt: Date.now()
  }

  try { await saveItem('last_weather', { timestamp: Date.now(), lat, lon, data: payload }) } catch (e) {}
  return payload
}

export async function loadCachedWeather() {
  try {
    const v = await loadItem('last_weather')
    return v ? v.data : null
  } catch (e) {
    return null
  }
}

export async function saveOfflineWeather(name = 'offline_weather') {
  try {
    const last = await loadItem('last_weather')
    if (!last) return false
    await saveItem(name, last.data)
    return true
  } catch (e) {
    return false
  }
}

export async function loadOfflineWeather(name = 'offline_weather') {
  try {
    const v = await loadItem(name)
    return v || null
  } catch (e) {
    return null
  }
}

export async function clearOfflineWeather(name = 'offline_weather') {
  try {
    await saveItem(name, null)
    return true
  } catch (e) {
    return false
  }
}
