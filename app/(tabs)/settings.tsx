import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import React, { useEffect, useState } from 'react'
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native'
import { Share } from 'react-native'

export default function Settings() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { showToast } = useToast()

  // profile.avatar will be a data URL (base64) or a remote URL
  const [profile, setProfile] = useState<{ name?: string; email?: string; location?: string; avatar?: string }>({})
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system')
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [language, setLanguage] = useState<string>('en')
  const { t, setLang } = useTranslation()
  const [notificationPrefs, setNotificationPrefs] = useState<{ mentions?: boolean; replies?: boolean; promotions?: boolean }>({ mentions: true, replies: true, promotions: false })
  const [anonId, setAnonId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const p = await loadItem('user_profile')
      if (p) setProfile(p)
      const t = await loadItem('theme_pref')
      if (t) setThemePref(t)
      const u = await loadItem('units')
      if (u) setUnits(u)
      const l = await loadItem('language')
      if (l) setLanguage(l)
      const n = await loadItem('notification_prefs')
      if (n) setNotificationPrefs(n)
      const a = await loadItem('anon_user_id')
      if (a) setAnonId(a)
    })()
  }, [])

  const saveProfile = async () => {
    await saveItem('user_profile', profile)
    showToast(t('data_imported') || 'Profile saved', 'success')
  }

  const removePhoto = async () => {
    const next = { ...profile }
    delete (next as any).avatar
    setProfile(next)
    await saveItem('user_profile', next)
    showToast(t('profile_cleared') || 'Profile photo removed', 'info')
  }

  const changePhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
          const file = input.files && input.files[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = async (ev) => {
            const dataUrl = ev.target?.result as string
            const next = { ...profile, avatar: dataUrl }
            setProfile(next)
            await saveItem('user_profile', next)
            showToast('Profile photo updated', 'success')
          }
          reader.onerror = () => showToast(t('failed_load_offline') || 'Failed to read file', 'error')
          reader.readAsDataURL(file)
        }
        input.click()
  } catch { console.warn('web pick failed'); showToast(t('photo_pick_failed') || 'Photo pick failed', 'error') }
    } else {
      // native picker not installed in workspace by default. Suggest install.
    showToast(t('import_not_implemented') || 'To change your photo on device install expo-image-picker and restart the app', 'info')
    }
  }

  const savePrefs = async () => {
    await saveItem('theme_pref', themePref)
    await saveItem('units', units)
    await saveItem('language', language)
    await saveItem('notification_prefs', notificationPrefs)
    showToast(t('save_preferences_message') || 'Preferences saved', 'success')
  }

  const regenerateAnon = async () => {
    Alert.alert(t('regenerate_id_title') || 'Regenerate ID', t('regenerate_id_message') || 'This will create a new anonymous id for this device. This cannot be linked to your previous id. Continue?', [
      { text: t('cancel') || 'Cancel', style: 'cancel' },
      { text: t('regenerate_id') || 'Regenerate', style: 'destructive', onPress: async () => {
        const id = `anon-${Date.now()}-${Math.floor(Math.random()*100000)}`
        await saveItem('anon_user_id', id)
        setAnonId(id)
        showToast(t('local_data_cleared') || 'Anonymous id regenerated', 'success')
      } }
    ])
  }

  const clearLocalData = async () => {
    // open in-app confirmation modal for a cleaner UX on mobile
    setShowConfirmClear(true)
  }

  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const doClearLocalData = async () => {
    const keys = ['forum_posts','liked_ids','notifications','last_weather','offline_weather','user_profile']
    for (const k of keys) await saveItem(k, null)
    showToast(t('local_data_cleared') || 'Local data cleared', 'success')
    setShowConfirmClear(false)
  }

  const exportData = async () => {
    // collect known keys
    const keys = ['user_profile','forum_posts','liked_ids','notifications','last_weather','notification_prefs']
    const out: any = {}
    for (const k of keys) out[k] = await loadItem(k)
    const content = JSON.stringify(out, null, 2)
    // on web we can open in new tab, on native we use Share
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      window.open(url)
    } else {
      try {
        await Share.share({ title: 'HuluFarm data export', message: content })
        showToast(t('data_exported') || 'Data exported', 'success')
      } catch (e: any) {
        console.log('Share failed', e?.message)
        showToast(t('data_exported') || 'Data exported (check console)', 'info')
      }
    }
  }

  const importData = async () => {
    Alert.alert('Import data', 'Import JSON data will overwrite local keys (user_profile, forum_posts, notifications, etc). Are you sure?', [
            { text: t('cancel') || 'Cancel', style: 'cancel' },
            { text: t('import_data') || 'Import', onPress: async () => {
        // in-app file picker is more work; we'll prompt user to paste JSON via prompt on web or read from clipboard on native as a simple path
        if (Platform.OS === 'web') {
          const raw = window.prompt(t('paste_exported_json') || 'Paste exported JSON:')
          if (!raw) return
          try {
            const obj = JSON.parse(raw)
            for (const k of Object.keys(obj)) await saveItem(k, obj[k])
            showToast('Data imported', 'success')
          } catch { showToast('Invalid JSON', 'error') }
        } else {
          showToast('Import on native not implemented', 'info')
        }
      } }
    ])
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
  <Text style={[styles.header, { color: colors.text }]}>{t('settings')}</Text>

      <CardUI>
      <Text style={styles.sectionTitle}>{t('profile')}</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
  <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {profile.avatar ? (
        <Image source={{ uri: profile.avatar }} style={{ width: 72, height: 72 }} />
      ) : (
    <Text style={{ fontSize: 28 }}>🙂</Text>
      )}
    </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
  <TouchableOpacity onPress={changePhoto} style={{ marginBottom: 8 }}><Text style={{ color: '#0366d6' }}>{t('change_photo')}</Text></TouchableOpacity>
  <TouchableOpacity onPress={removePhoto}><Text style={{ color: '#ef4444' }}>{t('remove_photo')}</Text></TouchableOpacity>
    </View>
  </View>
  <Input placeholder={t('full_name') || 'Full name'} value={profile.name || ''} onChangeText={(v: string) => setProfile(p => ({ ...p, name: v }))} />
  <Input placeholder={t('email') || 'Email'} keyboardType="email-address" value={profile.email || ''} onChangeText={(v: string) => setProfile(p => ({ ...p, email: v }))} />
  <Input placeholder={t('location_optional') || 'Location (optional)'} value={profile.location || ''} onChangeText={(v: string) => setProfile(p => ({ ...p, location: v }))} />
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
        <Button style={{ flex: 1, marginRight: 8 }} onPress={saveProfile}>{t('save')}</Button>
          <Button variant="outline" style={{ flex: 1 }} onPress={async () => { setProfile({}); await saveItem('user_profile', null); showToast(t('profile_cleared') || 'Profile cleared', 'info') }}>{t('clear') || 'Clear'}</Button>
        </View>
      </CardUI>

      <CardUI>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>{t('theme')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {(['system','light','dark'] as const).map(t => (
              <TouchableOpacity key={t} onPress={() => setThemePref(t)} style={[styles.pill, themePref===t && styles.pillActive]}>
                <Text style={themePref===t ? styles.pillTextActive : styles.pillText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t('units')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {(['metric','imperial'] as const).map(u => (
              <TouchableOpacity key={u} onPress={() => setUnits(u)} style={[styles.pill, units===u && styles.pillActive]}>
                <Text style={units===u ? styles.pillTextActive : styles.pillText}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 12 }]}>{t('language')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {(['en','am','om','ti','sid'] as const).map(l => (
              <TouchableOpacity key={l} onPress={() => { setLanguage(l); setLang(l as any) }} style={[styles.pill, language===l && styles.pillActive]}>
                <Text style={language===l ? styles.pillTextActive : styles.pillText}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>{t('notifications')}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity onPress={() => setNotificationPrefs(p => ({ ...p, mentions: !p.mentions }))} style={[styles.toggle, notificationPrefs.mentions && styles.toggleOn]}>
                <Text style={notificationPrefs.mentions ? styles.toggleTextOn : styles.toggleText}>Mentions</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNotificationPrefs(p => ({ ...p, replies: !p.replies }))} style={[styles.toggle, notificationPrefs.replies && styles.toggleOn]}>
                <Text style={notificationPrefs.replies ? styles.toggleTextOn : styles.toggleText}>Replies</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setNotificationPrefs(p => ({ ...p, promotions: !p.promotions }))} style={[styles.toggle, notificationPrefs.promotions && styles.toggleOn]}>
                <Text style={notificationPrefs.promotions ? styles.toggleTextOn : styles.toggleText}>Promotions</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Button style={{ flex: 1, marginRight: 8 }} onPress={savePrefs}>Save Preferences</Button>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => { setThemePref('system'); setUnits('metric'); setLanguage('en'); setNotificationPrefs({ mentions: true, replies: true, promotions: false }); showToast('Preferences reset', 'info') }}>Reset</Button>
          </View>
        </View>
      </CardUI>

      <CardUI>
  <Text style={styles.sectionTitle}>{t('account')}</Text>
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Anonymous ID</Text>
          <Text style={{ color: '#6b7280', marginTop: 6 }}>{anonId || 'Not set'}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button style={{ flex: 1, marginRight: 8 }} onPress={regenerateAnon}>Regenerate ID</Button>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => { Alert.alert('Sign out', 'This app uses anonymous ids; to effectively sign out clear local data.', [{ text: 'OK' }]) }}>Sign out</Button>
          </View>

          <View style={{ marginTop: 12 }}>
            <Button variant="destructive" onPress={clearLocalData}>Clear local data</Button>
          </View>
        </View>
      </CardUI>

      <CardUI>
  <Text style={styles.sectionTitle}>{t('data')}</Text>
        <View style={{ marginTop: 8 }}>
          <Button style={{ marginBottom: 8 }} onPress={exportData}>Export data</Button>
          <Button variant="outline" onPress={importData}>Import data</Button>
        </View>
      </CardUI>

      <View style={{ height: 80 }} />
      <Modal visible={showConfirmClear} transparent animationType="fade" onRequestClose={() => setShowConfirmClear(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '90%', maxWidth: 420 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{t('clear_local_data_title') || 'Clear local data'}</Text>
            <Text style={{ color: '#6b7280', marginBottom: 16 }}>{t('clear_local_data_confirm') || 'This will remove local stored posts, likes, notifications and cached weather. This is irreversible on this device. Continue?'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setShowConfirmClear(false)} style={{ padding: 8, marginRight: 8 }}><Text>{t('cancel') || 'Cancel'}</Text></TouchableOpacity>
              <TouchableOpacity onPress={doClearLocalData} style={{ padding: 8 }}><Text style={{ color: '#ef4444' }}>{t('clear') || 'Clear'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  label: { fontSize: 13, color: '#374151' },
  pill: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, marginRight: 8 },
  pillActive: { backgroundColor: '#0366d6' },
  pillText: { color: '#374151' },
  pillTextActive: { color: '#fff' },
  toggle: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8, marginRight: 8 },
  toggleOn: { backgroundColor: '#DCFCE7' },
  toggleText: { color: '#374151' },
  toggleTextOn: { color: '#166534' }
})
