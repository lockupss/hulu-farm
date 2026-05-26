import React, { createContext, useContext, useEffect, useState } from 'react'
import { getJSON } from './api'
import { useTranslation } from './i18n'
import { loadItem, saveItem } from './storage'
import { loadCachedWeather } from './weather'

type AppData = {
  weather: any | null
  market: any | null
  marketUpdatedAt: number | null
  weatherUpdatedAt: number | null
  refreshWeather: () => Promise<void>
  refreshMarket: () => Promise<void>
}

const ctx = createContext<AppData>({
  weather: null,
  market: null,
  marketUpdatedAt: null,
  weatherUpdatedAt: null,
  refreshWeather: async () => {},
  refreshMarket: async () => {},
})

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useTranslation()
  const [weather, setWeather] = useState<any | null>(null)
  const [market, setMarket] = useState<any | null>(null)
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<number | null>(null)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<number | null>(null)

  const refreshWeather = async () => {
    try {
      const cached = await loadCachedWeather()
      if (cached) {
        setWeather(cached)
        setWeatherUpdatedAt(cached.fetchedAt || null)
      }
    } catch (e) {
      // ignore
    }
  }

  const refreshMarket = async () => {
    try {
      const res = await getJSON('/api/market')
      const now = Date.now()
      setMarket(res)
      setMarketUpdatedAt(now)
      // persist to local storage for offline access
      try {
        await saveItem('last_market', { data: res, timestamp: now })
      } catch {
        // ignore save errors
      }
    } catch (e) {
      // network failed — keep existing cached state
    }
  }

  // Load cached data immediately on mount, then refresh from network in background
  useEffect(() => {
    let mounted = true

    const loadCached = async () => {
      try {
        // Load cached weather immediately
        const cachedWeather = await loadCachedWeather()
        if (cachedWeather && mounted) {
          setWeather(cachedWeather)
          setWeatherUpdatedAt(cachedWeather.fetchedAt || null)
        }

        // Load cached market immediately
        const cachedMarket = await loadItem('last_market')
        if (cachedMarket && mounted) {
          setMarket(cachedMarket.data)
          setMarketUpdatedAt(cachedMarket.timestamp || null)
        }
      } catch {
        // ignore cache load errors
      }

      // Background network refresh (silent, won't show spinners)
      if (mounted) {
        refreshMarket().catch(() => {})
      }
    }

    loadCached()

    // Periodic background sync every 5 minutes
    const iid = setInterval(() => {
      refreshWeather().catch(() => {})
      refreshMarket().catch(() => {})
    }, 1000 * 60 * 5)

    // Listen for online status changes to auto-sync
    const handleOnline = () => {
      refreshWeather().catch(() => {})
      refreshMarket().catch(() => {})
    }

    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', handleOnline)
      }
    } catch {
      // ignore
    }

    return () => {
      mounted = false
      clearInterval(iid)
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('online', handleOnline)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  // Re-fetch market data when language changes (for translated content)
  useEffect(() => {
    refreshMarket().catch(() => {})
  }, [lang])

  return (
    <ctx.Provider value={{ weather, market, marketUpdatedAt, weatherUpdatedAt, refreshWeather, refreshMarket }}>
      {children}
    </ctx.Provider>
  )
}

export const useAppData = () => useContext(ctx)

export default useAppData
