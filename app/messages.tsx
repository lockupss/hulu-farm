import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { Stack, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type ThreadRow = {
  threadId: string
  otherUserId: string
  other: { displayName: string; avatarUrl?: string | null }
  lastMessage: { text: string; time: string; from: string } | null
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()
  const router = useRouter()
  const { token, isSignedIn, user } = useAuth()
  const [threads, setThreads] = useState<ThreadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [avatars, setAvatars] = useState<Record<string, string | null>>({})

  const load = useCallback(async () => {
    if (!token) {
      setThreads([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getJSON('/api/inbox', token)
      const list = data.threads || []
      setThreads(list)
      const map: Record<string, string | null> = {}
      for (const row of list) {
        map[row.otherUserId] = await resolveMediaUrl(row.other?.avatarUrl)
      }
      setAvatars(map)
    } catch {
      setThreads([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (!isSignedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t('messages') || 'Messages' }} />
        <Text style={{ color: colors.text }}>{t('sign_in_to_interact') || 'Sign in to view messages'}</Text>
        <TouchableOpacity onPress={() => router.push('/login')} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.tint, fontWeight: '700' }}>{t('sign_in') || 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: t('messages') || 'Messages' }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.threadId}
          contentContainerStyle={{ paddingVertical: 8 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>{t('no_messages') || 'No conversations yet. Open someone’s profile and tap Message.'}</Text>
          }
          renderItem={({ item }) => {
            const uri = avatars[item.otherUserId]
            const preview = item.lastMessage
              ? item.lastMessage.from === user?.id
                ? `${t('you') || 'You'}: ${item.lastMessage.text}`
                : item.lastMessage.text
              : ''
            return (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/chat/${item.threadId}`)}
              >
                <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
                  {uri ? <Image source={{ uri }} style={styles.avatarImg} /> : <Text style={{ fontSize: 22 }}>👤</Text>}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{item.other.displayName}</Text>
                  {!!preview && (
                    <Text numberOfLines={1} style={{ color: colors.textMuted, marginTop: 4, fontSize: 13 }}>
                      {preview}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  empty: { textAlign: 'center', padding: 24, fontSize: 15 },
})
