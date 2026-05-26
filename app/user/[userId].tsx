import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()
  const { showToast } = useToast()
  const router = useRouter()
  const { user: me, token, isSignedIn } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      // Django GET /api/v1/auth/users/<username>/ returns user object directly
      const data = await getJSON(`/api/v1/auth/users/${userId}/`, token)
      const normalized = {
        ...data,
        displayName: data.full_name || data.username || userId,
        avatarUrl: data.avatar || null,
        locationLabel: data.location || null,
        bio: data.bio || null,
      }
      setProfile(normalized)
      const uri = await resolveMediaUrl(normalized.avatarUrl)
      setAvatarUri(uri)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [userId, token])

  useEffect(() => {
    load()
  }, [load])

  const isSelf = me?.id && userId && String(me.id) === String(userId)

  if (loading || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: '…' }} />
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: profile.displayName }} />
      <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
        <CardUI>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
              {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImg} /> : <Text style={{ fontSize: 36 }}>👤</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.name, { color: colors.text }]}>{profile.displayName}</Text>
              {!!profile.locationLabel && <Text style={{ color: colors.textMuted, marginTop: 4 }}>{profile.locationLabel}</Text>}
            </View>
          </View>
          {!!profile.bio && <Text style={{ marginTop: 16, color: colors.text, lineHeight: 22 }}>{profile.bio}</Text>}
          {!isSelf && isSignedIn && (
            <View style={styles.actions}>
              <Button
                style={{ flex: 1 }}
                variant="outline"
                onPress={() => showToast('Follow feature not available yet', 'info')}
              >
                {t('follow') || 'Follow'}
              </Button>
              <Button
                style={{ flex: 1, marginLeft: 10 }}
                variant="outline"
                onPress={() => showToast('Chat feature not available yet', 'info')}
              >
                {t('message') || 'Message'}
              </Button>
            </View>
          )}
          {!isSelf && !isSignedIn && (
            <Button style={{ marginTop: 16 }} onPress={() => router.push('/login')}>
              {t('sign_in') || 'Sign in'} — {t('message') || 'Message'}
            </Button>
          )}
        </CardUI>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  wrap: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  name: { fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', marginTop: 20 },
})
