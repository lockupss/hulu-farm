import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, postJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import type { Lang } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'

type Msg = { id: string; from: string; text: string; time: string }

export default function ChatThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t, lang } = useTranslation()
  const timeLocale = chatLocaleForLang(lang)
  const router = useRouter()
  const { token, user, isSignedIn } = useAuth()
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [peerDisplayName, setPeerDisplayName] = useState<string | null>(null)

  const otherUserId = React.useMemo(() => {
    if (!threadId || !user?.id) return null
    const [a, b] = String(threadId).split(':')
    if (a === user.id) return b
    if (b === user.id) return a
    return null
  }, [threadId, user?.id])

  const load = useCallback(async () => {
    if (!token || !threadId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getJSON(`/api/chat/${threadId}/messages`, token)
      setMessages(data.messages || [])
      if (otherUserId) {
        const u = await getJSON(`/api/users/${otherUserId}`, token)
        setPeerDisplayName(u.user?.displayName ?? null)
      } else {
        setPeerDisplayName(null)
      }
    } catch {
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [token, threadId, otherUserId])

  useEffect(() => {
    load()
  }, [load])

  const send = async () => {
    const v = text.trim()
    if (!v || !token || !threadId) return
    setText('')
    try {
      const res = await postJSON(`/api/chat/${threadId}/messages`, { text: v }, token)
      setMessages((m) => [...m, res.message])
    } catch {
      setText(v)
    }
  }

  useEffect(() => {
    if (!isSignedIn) router.replace('/login')
  }, [isSignedIn, router])

  const headerTitle = peerDisplayName || t('chat_screen_title')

  if (!isSignedIn) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t('chat_screen_title') }} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: headerTitle }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const mine = item.from === user?.id
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <View style={[styles.bubble, { backgroundColor: mine ? colors.tint : colors.surfaceMuted }]}>
                  <Text style={{ color: mine ? '#fff' : colors.text }}>{item.text}</Text>
                  <Text style={[styles.time, { color: mine ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                    {new Date(item.time).toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            )
          }}
        />
      )}
      <View style={[styles.compose, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <Input placeholder={t('chat_placeholder') || 'Message…'} value={text} onChangeText={setText} style={{ flex: 1 }} />
        <Button style={{ marginLeft: 8 }} onPress={send}>
          {t('send') || 'Send'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  )
}

function chatLocaleForLang(l: Lang): string | string[] | undefined {
  switch (l) {
    case 'am':
      return 'am-ET'
    case 'om':
      return 'om-ET'
    case 'ti':
      return 'ti-ER'
    case 'sid':
      return 'sid-ET'
    default:
      return undefined
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubbleWrap: { marginVertical: 4, maxWidth: '92%' },
  bubbleMine: { alignSelf: 'flex-end' },
  bubbleTheirs: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  time: { fontSize: 10, marginTop: 4 },
  compose: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1 },
})
