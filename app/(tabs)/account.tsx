import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { resolveMediaUrl } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function AccountTab() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t, lang } = useTranslation()
  const { showToast } = useToast()
  const router = useRouter()
  const { user, token, loading, isSignedIn, logout, updateProfile, syncDeviceContext } = useAuth()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [locLabel, setLocLabel] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.displayName || '')
      setBio(user.bio || '')
      setLocLabel(user.locationLabel || '')
      ;(async () => {
        const u = await resolveMediaUrl(user.avatarUrl || null)
        setAvatarUri(u)
      })()
    }
  }, [user])

  const pickAvatar = async () => {
    if (Platform.OS === 'web') {
      showToast(t('use_native_photo') || 'On web, profile photo upload uses the same flow as Settings.', 'info')
      return
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      showToast(t('photo_permission_denied') || 'Photo library permission is needed.', 'error')
      return
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
      base64: true,
    })
    if (res.canceled || !res.assets?.[0]?.base64) return
    const asset = res.assets[0]
    setBusy(true)
    try {
      const next = await updateProfile({
        avatar: { data: asset.base64 as string, name: asset.fileName || 'profile.jpg' },
      })
      const u = await resolveMediaUrl(next.avatarUrl || null)
      setAvatarUri(u)
      showToast(t('profile_saved') || 'Profile updated', 'success')
    } catch {
      showToast(t('photo_pick_failed') || 'Could not update photo', 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveFields = async () => {
    if (!isSignedIn) return
    setBusy(true)
    try {
      await updateProfile({
        displayName: name.trim() || undefined,
        bio: bio.slice(0, 500),
        locationLabel: locLabel.slice(0, 120),
      })
      showToast(t('profile_saved') || 'Profile saved', 'success')
    } catch {
      showToast(t('register_failed') || 'Save failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const syncLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      showToast(t('location_denied') || 'Location permission denied', 'error')
      return
    }
    try {
      const pos = await Location.getCurrentPositionAsync({})
      await syncDeviceContext({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      showToast(t('location_synced') || 'Location updated', 'success')
    } catch {
      showToast(t('location_failed') || 'Could not read location', 'error')
    }
  }

  const syncContacts = async () => {
    if (Platform.OS === 'web') {
      showToast(t('contacts_native_only') || 'Contact matching is available on the mobile app.', 'info')
      return
    }
    showToast('Contact sync not available in the current backend', 'info')
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!isSignedIn) {
    return (
      <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
        <Text style={[styles.h1, { color: colors.text }]}>{t('account_tab') || 'Account'}</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>{t('account_guest_sub') || 'Sign in to post in the forum, build your profile, and connect with other farmers.'}</Text>
        <CardUI style={{ marginTop: 16 }}>
          <Button onPress={() => router.push('/login')}>{t('sign_in') || 'Sign in'}</Button>
          <Button variant="outline" style={{ marginTop: 10 }} onPress={() => router.push('/register')}>
            {t('create_account') || 'Create account'}
          </Button>
        </CardUI>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.h1, { color: colors.text }]}>{t('account_tab') || 'Account'}</Text>
      <CardUI style={{ marginTop: 12 }}>
        <View style={styles.row}>
          <TouchableOpacity onPress={pickAvatar} style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 28 }}>👤</Text>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{user?.email}</Text>
            <Button variant="outline" style={{ marginTop: 8 }} onPress={pickAvatar} disabled={busy}>
              {t('change_photo') || 'Change photo'}
            </Button>
          </View>
        </View>
        <Input placeholder={t('full_name') || 'Display name'} value={name} onChangeText={setName} style={{ marginTop: 14 }} />
        <Input placeholder={t('bio') || 'Bio'} value={bio} onChangeText={setBio} multiline style={{ marginTop: 12, minHeight: 72 }} />
        <Input
          placeholder={t('location_optional') || 'Location (e.g. region)'}
          value={locLabel}
          onChangeText={setLocLabel}
          style={{ marginTop: 12 }}
        />
        <Button style={{ marginTop: 14 }} onPress={saveFields} disabled={busy}>
          {t('save') || 'Save profile'}
        </Button>
      </CardUI>

      <Text style={[styles.section, { color: colors.text }]}>{t('find_people') || 'Find people'}</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('find_people_hint') || 'Sync your area to help other farmers nearby find you.'}</Text>
      <View style={styles.btnRow}>
        <Button variant="outline" style={{ flex: 1 }} onPress={syncLocation}>
          {t('sync_location') || 'Sync area'}
        </Button>
        <Button variant="outline" style={{ flex: 1, marginLeft: 8 }} onPress={syncContacts}>
          {t('sync_contacts') || 'Sync contacts'}
        </Button>
      </View>

      <Button style={{ marginTop: 20 }} onPress={() => router.push('/messages')}>
        {t('messages') || 'Messages'}
      </Button>
      <Button variant="outline" style={{ marginTop: 12 }} onPress={() => logout()}>
        {t('sign_out') || 'Sign out'}
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  wrap: { padding: 16, paddingBottom: 40 },
  h1: { fontSize: 24, fontWeight: '800' },
  sub: { marginTop: 8, fontSize: 15 },
  section: { marginTop: 24, fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 13, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  btnRow: { flexDirection: 'row', marginTop: 12 },
})
