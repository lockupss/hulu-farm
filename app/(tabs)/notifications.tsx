import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { deleteJSON, getJSON, postJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  id: string
  notification_type: string
  type: 'alert' | 'success' | 'info'
  title: string
  message: string
  post_slug: string
  comment_id: string
  is_read: boolean
  created_at: string
  actor_name: string
  actor_avatar: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function getIcon(type: string, notifType: string) {
  if (notifType === 'comment') return '💬'
  if (notifType === 'reply') return '↩️'
  if (notifType === 'like_post' || notifType === 'like_comment') return '❤️'
  if (notifType === 'new_post') return '📢'
  if (notifType === 'system') return '📣'
  if (type === 'alert') return '⚠️'
  if (type === 'success') return '✅'
  return 'ℹ️'
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function Notifications() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const dark = colorScheme === 'dark'
  const { token, isSignedIn } = useAuth()
  const router = useRouter()

  const [notes, setNotes] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!token) { setLoading(false); return }
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await getJSON('/api/v1/notifications/', token)
      const list: Notification[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : []
      setNotes(list)
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const onRefresh = () => { setRefreshing(true); fetchNotifications(true) }

  const markRead = async (id: string, value = true) => {
    // Optimistic update
    setNotes(prev => prev.map(n => n.id === id ? { ...n, is_read: value } : n))
    try {
      await postJSON(`/api/v1/notifications/${id}/read/`, { read: value }, token)
    } catch {
      // Revert on failure
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_read: !value } : n))
    }
  }

  const markAllRead = async () => {
    setNotes(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await postJSON('/api/v1/notifications/mark-all-read/', {}, token)
    } catch {
      fetchNotifications(true)
    }
  }

  const clearAll = async () => {
    Alert.alert(
      t('clear_notifications_title') || 'Clear notifications',
      t('clear_notifications_confirm') || 'Are you sure you want to clear all notifications?',
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('clear_all') || 'Clear', style: 'destructive',
          onPress: async () => {
            const prev = notes
            setNotes([])
            try {
              await deleteJSON('/api/v1/notifications/clear/', token)
            } catch {
              setNotes(prev)
            }
          },
        },
      ]
    )
  }

  const openTarget = (item: Notification) => {
    if (item.post_slug) router.push('/community')
    else router.push('/community')
  }

  const unreadCount = notes.filter(n => !n.is_read).length
  const ordered = [...notes].sort((a, b) => (a.is_read === b.is_read ? 0 : a.is_read ? 1 : -1))

  const bg = dark ? '#000' : colors.background
  const border = dark ? '#2F3336' : '#EFF3F4'
  const textMain = dark ? '#E7E9EA' : colors.text
  const muted = dark ? '#71767B' : '#6b7280'

  // ── Not signed in ──────────────────────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
        <Text style={[styles.title, { color: textMain, textAlign: 'center' }]}>
          {t('notifications_title') || 'Notifications'}
        </Text>
        <Text style={{ color: muted, marginTop: 8, textAlign: 'center', fontSize: 15 }}>
          Sign in to see likes, comments, and replies on your posts.
        </Text>
        <TouchableOpacity
          style={[styles.signInBtn, { backgroundColor: '#1D9BF0', marginTop: 24 }]}
          onPress={() => router.push('/login')}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1D9BF0" />
      </View>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ color: muted, textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity style={[styles.signInBtn, { backgroundColor: '#1D9BF0', marginTop: 16 }]} onPress={() => fetchNotifications()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View>
          <Text style={[styles.title, { color: textMain }]}>
            {t('notifications_title') || 'Notifications'}
            {unreadCount > 0 && (
              <Text style={{ color: '#1D9BF0' }}> · {unreadCount}</Text>
            )}
          </Text>
          <Text style={[styles.subtitle, { color: muted }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
              <Text style={{ color: '#1D9BF0', fontWeight: '600', fontSize: 13 }}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notes.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={[styles.headerBtn, { marginLeft: 8 }]}>
              <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 13 }}>
                {t('clear_all') || 'Clear all'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {ordered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>🔔</Text>
          <Text style={[styles.emptyTitle, { color: textMain }]}>No notifications yet</Text>
          <Text style={[styles.emptyText, { color: muted }]}>
            When someone likes or comments on your posts, it will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D9BF0" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => { openTarget(item); markRead(item.id) }}
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.is_read
                    ? (dark ? '#16181C' : '#FFFFFF')
                    : (dark ? '#1A2535' : '#EFF6FF'),
                  borderColor: item.is_read ? border : (dark ? '#2A4A7F' : '#BFDBFE'),
                },
              ]}
            >
              {/* Unread dot */}
              {!item.is_read && <View style={styles.unreadDot} />}

              {/* Icon */}
              <Text style={styles.icon}>{getIcon(item.type, item.notification_type)}</Text>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={styles.notifTop}>
                  <Text style={[styles.notifTitle, { color: textMain }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.notifTime, { color: muted }]}>{formatTime(item.created_at)}</Text>
                </View>
                {!!item.message && (
                  <Text style={[styles.notifMsg, { color: muted }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                )}
                <View style={styles.notifFooter}>
                  <TouchableOpacity
                    onPress={() => markRead(item.id, !item.is_read)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ color: '#1D9BF0', fontSize: 12 }}>
                      {item.is_read ? 'Mark unread' : 'Mark read'}
                    </Text>
                  </TouchableOpacity>
                  {item.post_slug ? (
                    <TouchableOpacity onPress={() => { openTarget(item); markRead(item.id) }}>
                      <Text style={{ color: '#059669', fontSize: 12 }}>View post →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { paddingHorizontal: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D9BF0',
  },
  icon: { fontSize: 22, marginTop: 1 },
  notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  notifTitle: { fontSize: 14, fontWeight: '700', flex: 1, lineHeight: 19 },
  notifTime: { fontSize: 11, marginTop: 2, flexShrink: 0 },
  notifMsg: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  notifFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
})