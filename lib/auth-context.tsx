import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getJSON, patchJSON, postJSON } from '@/lib/api'
import { loadItem, removeItems, saveItem } from '@/lib/storage'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user_cached'

export type AuthUser = {
  id: string
  displayName: string
  bio?: string
  avatarUrl?: string | null
  email?: string
  locationLabel?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  loading: boolean
  isSignedIn: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (patch: {
    displayName?: string
    bio?: string
    locationLabel?: string
    avatar?: { data: string; name: string }
    clearAvatar?: boolean
  }) => Promise<AuthUser>
  syncDeviceContext: (opts: { lat?: number; lng?: number; contactHashes?: string[] }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const persistSession = useCallback(async (t: string | null, u: AuthUser | null) => {
    if (t && u) {
      await saveItem(TOKEN_KEY, t)
      await saveItem(USER_KEY, u)
    } else {
      await removeItems([TOKEN_KEY, USER_KEY])
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const t = token
    if (!t) return
    try {
      const data = await getJSON('/api/auth/me', t)
      const u = data.user as AuthUser
      setUser(u)
      await saveItem(USER_KEY, u)
    } catch {
      setUser(null)
      setToken(null)
      await persistSession(null, null)
    }
  }, [token, persistSession])

  useEffect(() => {
    ;(async () => {
      try {
        const t = await loadItem(TOKEN_KEY)
        const u = await loadItem(USER_KEY)
        const tok = typeof t === 'string' ? t : null
        setToken(tok)
        setUser(u && typeof u === 'object' && u.id ? (u as AuthUser) : null)
        if (tok) {
          try {
            const data = await getJSON('/api/auth/me', tok)
            setUser(data.user as AuthUser)
            await saveItem(USER_KEY, data.user)
          } catch {
            setToken(null)
            setUser(null)
            await persistSession(null, null)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [persistSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const emailNorm = email.trim().toLowerCase()
      const data = await postJSON('/api/auth/login', { email: emailNorm, password })
      const tok = data.token as string
      const partial = data.user as AuthUser
      const merged: AuthUser = { ...partial, email: emailNorm }
      setToken(tok)
      setUser(merged)
      await persistSession(tok, merged)
      try {
        const full = await getJSON('/api/auth/me', tok)
        setUser(full.user as AuthUser)
        await saveItem(USER_KEY, full.user)
      } catch {
        await saveItem(USER_KEY, merged)
      }
    },
    [persistSession]
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const emailNorm = email.trim().toLowerCase()
      const data = await postJSON('/api/auth/register', {
        email: emailNorm,
        password,
        displayName,
      })
      const tok = data.token as string
      const partial = data.user as AuthUser
      const merged: AuthUser = { ...partial, email: emailNorm }
      setToken(tok)
      setUser(merged)
      await persistSession(tok, merged)
      try {
        const full = await getJSON('/api/auth/me', tok)
        setUser(full.user as AuthUser)
        await saveItem(USER_KEY, full.user)
      } catch {
        await saveItem(USER_KEY, merged)
      }
    },
    [persistSession]
  )

  const logout = useCallback(async () => {
    const t = token
    if (t) {
      try {
        await postJSON('/api/auth/logout', {}, t)
      } catch {
        /* ignore */
      }
    }
    setToken(null)
    setUser(null)
    await persistSession(null, null)
  }, [token, persistSession])

  const updateProfile = useCallback(
    async (patch: {
      displayName?: string
      bio?: string
      locationLabel?: string
      avatar?: { data: string; name: string }
      clearAvatar?: boolean
    }) => {
      const t = token
      if (!t) throw new Error('not_signed_in')
      const data = await patchJSON('/api/users/me', patch, t)
      const next = data.user as AuthUser
      setUser(next)
      await saveItem(USER_KEY, next)
      return next
    },
    [token]
  )

  const syncDeviceContext = useCallback(
    async (opts: { lat?: number; lng?: number; contactHashes?: string[] }) => {
      const t = token
      if (!t) return
      try {
        await postJSON('/api/users/me/sync', opts, t)
      } catch {
        /* offline */
      }
    },
    [token]
  )

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isSignedIn: !!token && !!user,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
      syncDeviceContext,
    }),
    [user, token, loading, login, register, logout, refreshProfile, updateProfile, syncDeviceContext]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
