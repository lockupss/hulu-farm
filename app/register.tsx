import { Button } from '@/components/ui/Button'
import CardUI from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from '@/lib/i18n'
import { Stack, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function RegisterScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()
  const { register } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr('')
    setBusy(true)
    try {
      await register(email.trim(), password, displayName.trim())
      router.replace('/(tabs)/account')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('409') || msg.includes('email_in_use')) setErr(t('email_in_use') || 'That email is already registered.')
      else if (msg.startsWith('network:') || msg.includes('Network request failed') || msg.includes('Failed to fetch'))
        setErr(t('api_unreachable') || 'Cannot reach the API. Run npm run api on your computer and use the same Wi‑Fi; set EXPO_PUBLIC_API_BASE to http://YOUR_PC_IP:3333 if needed.')
      else if (msg.includes('persist_failed'))
        setErr(t('server_save_failed') || 'Server could not save your account. Check that the data folder is writable.')
      else setErr(msg.length > 120 ? (t('register_failed') || 'Could not create account.') : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('create_account') || 'Create account', headerShown: true }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>{t('create_account') || 'Create account'}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{t('register_sub') || 'Choose a display name other farmers will see on posts and chat.'}</Text>
          <CardUI style={styles.card}>
            <Input placeholder={t('full_name') || 'Display name'} value={displayName} onChangeText={setDisplayName} />
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={t('email') || 'Email'}
              value={email}
              onChangeText={setEmail}
              style={{ marginTop: 12 }}
            />
            <Input secureTextEntry placeholder={t('password') || 'Password'} value={password} onChangeText={setPassword} style={{ marginTop: 12 }} />
            {!!err && <Text style={styles.err}>{err}</Text>}
            <Button style={{ marginTop: 16 }} onPress={submit} disabled={busy}>
              {busy ? '…' : t('create_account') || 'Create account'}
            </Button>
          </CardUI>
          <TouchableOpacity onPress={() => router.back()} style={styles.linkWrap}>
            <Text style={{ color: colors.tint }}>{t('have_account') || 'Already have an account? Sign in'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 20, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { marginTop: 8, marginBottom: 20, fontSize: 15 },
  card: { paddingVertical: 8 },
  err: { color: '#dc2626', marginTop: 12, fontSize: 14 },
  linkWrap: { marginTop: 20, alignItems: 'center' },
})
