import CardUI from '@/components/ui/Card'
import { CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON } from '@/lib/api'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import notificationsSeed from '../../data/notifications.json'

const DEFAULT_PREFS = { 'Weather Alerts': true, 'Price Updates': true, 'Disease Alerts': true, 'Community Posts': true, 'Farm Reminders': true }

export default function Notifications() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<any[]>(notificationsSeed)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_PREFS)

  useEffect(() => {
    let mounted = true
  ;(async () => {
      try {
        // load persisted notifications and prefs
        const persisted = await loadItem('notifications')
        const savedPrefs = await loadItem('notification_prefs')
        if (savedPrefs) setPrefs(savedPrefs)
        if (persisted && Array.isArray(persisted)) setNotes(persisted)

        // build prefs list for query
  const enabled = Object.keys(savedPrefs || DEFAULT_PREFS).filter(k => (savedPrefs || DEFAULT_PREFS)[k])
        const q = enabled.length ? `?prefs=${encodeURIComponent(JSON.stringify(enabled))}` : ''
        const n = await getJSON(`/api/notifications${q}`)
        const remote = Array.isArray(n) ? n : notificationsSeed
        const merged = remote.map((r: any) => {
          const p = (persisted || []).find((x: any) => String(x.id) === String(r.id))
          return {
            id: r.id || `${Date.now()}-${Math.random()}`,
            type: r.type || (String(r.text || '').toLowerCase().includes('market') ? 'success' : (String(r.text || '').toLowerCase().includes('alert') ? 'alert' : 'info')),
            title: r.title || r.text || 'Notification',
            message: r.message || r.text || '',
            time: r.time || r.time_ago || 'now',
            read: p ? !!p.read : !!r.read
          }
        })
        if (!mounted) return
        setNotes(merged)
        await saveItem('notifications', merged)
    } catch {
      console.warn('Failed to fetch notifications')
      // fallback to seed data when remote fetch fails
      setNotes(notificationsSeed.map((r: any, i: number) => ({ id: r.id || i, title: r.text, message: r.text, time: r.time || 'now', type: 'info', read: false })))
    } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const togglePref = (key: string) => setPrefs(s => ({ ...s, [key]: !s[key] }))
  const router = useRouter()

  const persistNotes = async (next: any[]) => {
    setNotes(next)
    try { await saveItem('notifications', next) } catch { console.warn('save notifications failed') }
  }

  const markRead = async (id: number, value = true) => {
    const next = notes.map(n => (String(n.id) === String(id) ? { ...n, read: value } : n))
    await persistNotes(next)
  }

  const clearAll = async () => {
    await persistNotes([])
  }

  // persist prefs and re-fetch notifications when prefs change
  useEffect(() => {
    ;(async () => {
      try {
        await saveItem('notification_prefs', prefs)
        const enabled = Object.keys(prefs).filter(k => prefs[k])
        const q = enabled.length ? `?prefs=${encodeURIComponent(JSON.stringify(enabled))}` : ''
        const n = await getJSON(`/api/notifications${q}`)
        if (Array.isArray(n)) {
          setNotes(n.map((r: any) => ({ id: r.id, title: r.title || r.text, message: r.message || r.text, time: r.time || 'now', type: r.type || 'info', read: false })))
          await saveItem('notifications', n)
        }
      } catch (e) {
        console.warn('failed to re-fetch notifications with prefs', e)
      }
    })()
  }, [prefs])

  const openMarket = (/*item*/) => router.push('/market')
  const openForum = (/*item*/) => router.push('/community')

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return '⚠️'
      case 'success': return '✅'
      default: return 'ℹ️'
    }
  }

  // sort unread first
  const ordered = [...notes].sort((a,b) => (a.read === b.read) ? 0 : (a.read ? 1 : -1))

  const confirmClear = () => {
    Alert.alert(t('clear_notifications_title') || 'Clear notifications', t('clear_notifications_confirm') || 'Are you sure you want to clear all notifications?', [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      { text: t('clear_all') || 'Clear', style: 'destructive', onPress: clearAll }
    ])
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.headerRow, { padding: 16 }]}> 
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('notifications_title')}</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>{t('notifications_sub')}</Text>
        </View>
        <TouchableOpacity onPress={confirmClear} style={{ alignSelf: 'center' }}>
          <Text style={{ color: '#ef4444', fontWeight: '700' }}>{t('clear_all')}</Text>
        </TouchableOpacity>
      </View>

      <CardUI style={{ marginHorizontal: 16 }}>
        <CardHeader>
          <CardTitle>{t('notification_prefs_title') || `🔔 ${t('notification_prefs')}`}</CardTitle>
        </CardHeader>
        <View style={{ paddingTop: 8 }}>
          {Object.keys(prefs).map((k) => (
            <View key={k} style={styles.prefRow}>
              <Text>{t(k.toLowerCase().replace(/\s+/g, '_')) || k}</Text>
              <Switch value={prefs[k]} onValueChange={() => togglePref(k)} />
            </View>
          ))}
        </View>
      </CardUI>

      {loading ? (
        <View style={{ padding: 16 }}><Text>{t('loading')}</Text></View>
      ) : (
        <FlatList
          data={ordered}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
              <CardUI variant={item.type === 'alert' ? 'alert' : item.type === 'info' ? 'info' : undefined}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 22 }}>{getIcon(item.type)}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '700' }}>{item.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {!item.read && <View style={styles.unreadDot} />}
                        <TouchableOpacity onPress={() => markRead(item.id, !item.read)} style={{ marginLeft: 12 }}>
                          <Text style={{ color: '#0366d6' }}>{item.read ? t('mark_unread') : t('mark_read')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={{ marginTop: 6 }}>{item.message}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={styles.time}>{item.time}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={openMarket}><Text style={{ color: '#059669' }}>{t('view_market')}</Text></TouchableOpacity>
                        <TouchableOpacity onPress={openForum} style={{ marginLeft: 12 }}><Text style={{ color: '#0366d6' }}>{t('view_forum')}</Text></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </CardUI>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { marginTop: 8, color: '#6b7280' },
  prefRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0ea5a4' }
})
