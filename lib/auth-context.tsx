import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getJSON, patchJSON, postJSON } from '@/lib/api'
import { loadItem, removeItems, saveItem } from '@/lib/storage'

const TOKEN_KEY = 'auth_token'
const REFRESH_KEY = 'auth_refresh_token'
const USER_KEY = 'auth_user_cached'

// Maps Django's user shape → app's AuthUser shape
function mapUser(raw: any, emailFallback?: string): AuthUser {
  return {
    id: String(raw.id ?? ''),
    displayName: raw.full_name || raw.username || '',
    bio: raw.bio ?? undefined,
    avatarUrl: raw.avatar ?? null,
    email: raw.email ?? emailFallback,
    locationLabel: raw.location ?? null,
  }
}

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
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const persistSession = useCallback(async (t: string | null, u: AuthUser | null) => {
    if (t && u) {
      await saveItem(TOKEN_KEY, t)
      await saveItem(USER_KEY, u)
    } else {
      await removeItems([TOKEN_KEY, REFRESH_KEY, USER_KEY])
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const t = token
    if (!t) return
    try {
      // Django GET /api/v1/auth/me/ returns the user object directly (no wrapper)
      const data = await getJSON('/api/v1/auth/me/', t)
      const u = mapUser(data)
      setUser(u)
      await saveItem(USER_KEY, u)
    } catch {
      setUser(null)
      setToken(null)
      setRefreshToken(null)
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
            const data = await getJSON('/api/v1/auth/me/', tok)
            const mapped = mapUser(data)
            setUser(mapped)
            await saveItem(USER_KEY, mapped)
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
      // Django POST /api/v1/auth/login/ returns { access, refresh, user }
      const data = await postJSON('/api/v1/auth/login/', { email: emailNorm, password })
      const access = data.access as string
      const refresh = data.refresh as string
      const merged = mapUser(data.user, emailNorm)
      setToken(access)
      setRefreshToken(refresh)
      setUser(merged)
      await saveItem(TOKEN_KEY, access)
      await saveItem(REFRESH_KEY, refresh)
      await saveItem(USER_KEY, merged)
    },
    []
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const emailNorm = email.trim().toLowerCase()
      // Django requires: email, username, full_name, password, password2
      const username = displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 50) || emailNorm.split('@')[0]
      // Django POST /api/v1/auth/register/ returns { user, tokens: { access, refresh } }
      const data = await postJSON('/api/v1/auth/register/', {
        email: emailNorm,
        username,
        full_name: displayName,
        password,
        password2: password,
      })
      const access = data.tokens.access as string
      const refresh = data.tokens.refresh as string
      const merged = mapUser(data.user, emailNorm)
      setToken(access)
      setRefreshToken(refresh)
      setUser(merged)
      await saveItem(TOKEN_KEY, access)
      await saveItem(REFRESH_KEY, refresh)
      await saveItem(USER_KEY, merged)
    },
    []
  )

  const logout = useCallback(async () => {
    const t = token
    if (t) {
      try {
        // Django POST /api/v1/auth/logout/ requires { refresh } to blacklist the token
        const storedRefresh = await loadItem(REFRESH_KEY)
        await postJSON('/api/v1/auth/logout/', { refresh: storedRefresh }, t)
      } catch {
        /* ignore */
      }
    }
    setToken(null)
    setRefreshToken(null)
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
      // Map app field names → Django field names
      const body: Record<string, any> = {}
      if (patch.displayName !== undefined) body.full_name = patch.displayName
      if (patch.bio !== undefined) body.bio = patch.bio
      if (patch.locationLabel !== undefined) body.location = patch.locationLabel
      // Django PATCH /api/v1/auth/me/ returns user object directly (no wrapper)
      const data = await patchJSON('/api/v1/auth/me/', body, t)
      const next = mapUser(data, user?.email)
      setUser(next)
      await saveItem(USER_KEY, next)
      return next
    },
    [token, user]
  )

  const syncDeviceContext = useCallback(
    async (_opts: { lat?: number; lng?: number; contactHashes?: string[] }) => {
      /* not implemented in Django backend */
    },
    []
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
