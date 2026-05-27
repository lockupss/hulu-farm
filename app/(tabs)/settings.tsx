import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function Settings() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { showToast } = useToast()
  const router = useRouter()
  const { t, setLang } = useTranslation()

  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system')
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric')
  const [language, setLanguage] = useState('en')
  const [notificationPrefs, setNotificationPrefs] = useState({
    mentions: true,
    replies: true,
    promotions: false,
  })

  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    ;(async () => {
      const t = await loadItem('theme_pref')
      const u = await loadItem('units')
      const l = await loadItem('language')
      const n = await loadItem('notification_prefs')

      if (t) setThemePref(t)
      if (u) setUnits(u)
      if (l) setLanguage(l)
      if (n) setNotificationPrefs(n)
    })()
  }, [])

  const savePrefs = async () => {
    await saveItem('theme_pref', themePref)
    await saveItem('units', units)
    await saveItem('language', language)
    await saveItem('notification_prefs', notificationPrefs)
    showToast('Preferences saved', 'success')
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.header, { color: colors.text }]}>{t('settings')}</Text>

      {/* ACCOUNT */}
      <CardUI style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.helpText}>
          Manage your profile and social settings.
        </Text>
        <Button style={styles.primaryBtn} onPress={() => router.push('/(tabs)/account')}>
          Open Account
        </Button>
      </CardUI>

      {/* PREFERENCES */}
      <CardUI style={styles.card}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <Text style={styles.label}>Theme</Text>
        <View style={styles.row}>
          {['system', 'light', 'dark'].map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => setThemePref(opt as any)}
              style={[styles.pill, themePref === opt && styles.pillActive]}
            >
              <Text style={themePref === opt ? styles.pillTextActive : styles.pillText}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Units</Text>
        <View style={styles.row}>
          {['metric', 'imperial'].map(u => (
            <TouchableOpacity
              key={u}
              onPress={() => setUnits(u as any)}
              style={[styles.pill, units === u && styles.pillActive]}
            >
              <Text style={units === u ? styles.pillTextActive : styles.pillText}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Language</Text>
        <View style={styles.row}>
          {['en', 'am', 'om', 'ti', 'sid'].map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => {
                setLanguage(l)
                setLang(l as any)
              }}
              style={[styles.pill, language === l && styles.pillActive]}
            >
              <Text style={language === l ? styles.pillTextActive : styles.pillText}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Notifications</Text>
        <View style={styles.row}>
          {['mentions', 'replies', 'promotions'].map(key => (
            <TouchableOpacity
              key={key}
              onPress={() =>
                setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
              }
              style={[
                styles.toggle,
                notificationPrefs[key as keyof typeof notificationPrefs] && styles.toggleOn,
              ]}
            >
              <Text style={
                notificationPrefs[key as keyof typeof notificationPrefs]
                  ? styles.toggleTextOn
                  : styles.toggleText
              }>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <Button style={[styles.primaryBtn, { flex: 1 }]} onPress={savePrefs}>
            Save
          </Button>
        </View>
      </CardUI>

      {/* STORAGE */}
      <CardUI style={styles.card}>
        <Text style={styles.sectionTitle}>Device</Text>
        <Button variant="destructive" onPress={() => setShowConfirmClear(true)}>
          Clear Local Data
        </Button>
      </CardUI>

      {/* MODAL */}
      <Modal visible={showConfirmClear} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={{ fontWeight: '700', marginBottom: 10 }}>
              Clear local data?
            </Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setShowConfirmClear(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={{ color: 'red' }}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: { fontSize: 26, fontWeight: '800', marginBottom: 16 },

  card: { marginBottom: 14 },

  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },

  helpText: { fontSize: 13, marginBottom: 10, color: '#6b7280' },

  label: { fontSize: 12, marginTop: 10, color: '#6b7280' },

  row: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    marginTop: 6,
  },

  pillActive: { backgroundColor: '#1D9BF0' },

  pillText: { color: '#374151' },

  pillTextActive: { color: '#fff' },

  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginRight: 8,
    marginTop: 6,
  },

  toggleOn: { backgroundColor: '#1D9BF0' },

  toggleText: { color: '#374151' },

  toggleTextOn: { color: '#fff' },

  primaryBtn: { marginTop: 12, backgroundColor: '#1D9BF0' },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
})