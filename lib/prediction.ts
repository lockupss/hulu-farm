/**
 * lib/prediction.ts
 * -----------------
 * Thin client for the Hulu Farm Flask prediction service.
 *
 * The Flask service runs on port 5001 (separate from Django on 8000).
 * Set EXPO_PUBLIC_PREDICTION_BASE in your .env to override the base URL,
 * e.g.:
 *   EXPO_PUBLIC_PREDICTION_BASE=http://192.168.1.42:5001
 */

export interface PricePrediction {
  date: string   // "YYYY-MM-DD"
  yhat: number   // predicted price (Birr per quintal)
  lower: number  // 80% confidence lower bound
  upper: number  // 80% confidence upper bound
}

export interface AllPredictions {
  Maize:   PricePrediction[]
  Wheat:   PricePrediction[]
  Teff:    PricePrediction[]
  Beans:   PricePrediction[]
  Barley:  PricePrediction[]
  Sorghum: PricePrediction[]
  [key: string]: PricePrediction[]
}

function getPredictionBase(): string {
  // Check env override first
  if (
    typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_PREDICTION_BASE
  ) {
    return String(process.env.EXPO_PUBLIC_PREDICTION_BASE).replace(/\/$/, "")
  }
  // Default: same host as Django but port 5001
  if (
    typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_API_BASE
  ) {
    const base = String(process.env.EXPO_PUBLIC_API_BASE)
    // Replace port 8000 with 5001 (or append :5001 if no port)
    return base.replace(/:8000\b/, ":5001").replace(/\/$/, "")
  }
  return "http://localhost:5001"
}

/**
 * Fetch 30-day predictions for a single commodity (legacy endpoint).
 * Used by the market.tsx prediction section.
 */
export async function fetchPricePredictions(
  dates: string[],
  commodity = "Teff"
): Promise<PricePrediction[]> {
  const base = getPredictionBase()
  const days = dates.length || 30
  const url  = `${base}/predict?days=${days}&commodity=${encodeURIComponent(commodity)}`

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: PricePrediction[] = await res.json()
    return data
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch predictions for ALL 6 crops in one request.
 * Preferred over fetchPricePredictions for the market page
 * since it avoids 6 separate HTTP calls.
 */
export async function fetchAllPredictions(
  days = 30
): Promise<AllPredictions | null> {
  const base = getPredictionBase()
  const url  = `${base}/predict/all?days=${days}`

  const controller = new AbortController()
  const timeout    = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json() as AllPredictions
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Returns the next N calendar dates as ISO strings starting from tomorrow.
 * Used to build the `dates` argument for fetchPricePredictions.
 */
export function nextNDays(n: number): string[] {
  const result: string[] = []
  const today = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    result.push(d.toISOString().slice(0, 10))
  }
  return result
}