import React, { createContext, useContext, useEffect, useState } from 'react'
import { getJSON } from './api'
import { loadCachedWeather } from './weather'

type AppData = {
  weather: any | null
  market: any | null
  refreshWeather: () => Promise<void>
  refreshMarket: () => Promise<void>
}

const ctx = createContext<AppData>({ weather: null, market: null, refreshWeather: async () => {}, refreshMarket: async () => {} })

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [weather, setWeather] = useState<any | null>(null)
  const [market, setMarket] = useState<any | null>(null)

  const refreshWeather = async () => {
    try {
      const cached = await loadCachedWeather()
      if (cached) setWeather(cached)
      // try a best-effort location fetch (web may not allow); consumer should call fetch with coords when available
    } catch (e) {
      // ignore
    }
  }

  const refreshMarket = async () => {
    try {
      const res = await getJSON('/api/market')
      setMarket(res)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    refreshWeather()
    refreshMarket()
    const iid = setInterval(() => { refreshWeather(); refreshMarket() }, 1000 * 60 * 5)
    return () => clearInterval(iid)
  }, [])

  return <ctx.Provider value={{ weather, market, refreshWeather, refreshMarket }}>{children}</ctx.Provider>
}

export const useAppData = () => useContext(ctx)

export default useAppData
