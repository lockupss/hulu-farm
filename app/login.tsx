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

export default function LoginScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr('')
    setBusy(true)
    try {
      await login(email.trim(), password)
      router.replace('/(tabs)/account')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.startsWith('network:') || msg.includes('Network request failed') || msg.includes('Failed to fetch'))
        setErr(t('api_unreachable') || 'Cannot reach the API. Run npm run api and use the same network as this device.')
      else if (msg.includes('401') || msg.includes('invalid_credentials'))
        setErr(t('login_failed') || 'Could not sign in. Check email and password.')
      else setErr(msg.length > 120 ? (t('login_failed') || 'Could not sign in.') : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('sign_in') || 'Sign in', headerShown: true }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: colors.text }]}>{t('sign_in') || 'Sign in'}</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{t('login_sub') || 'Post, reply, like, and message other farmers.'}</Text>
          <CardUI style={styles.card}>
            <Input autoCapitalize="none" keyboardType="email-address" placeholder={t('email') || 'Email'} value={email} onChangeText={setEmail} />
            <Input secureTextEntry placeholder={t('password') || 'Password'} value={password} onChangeText={setPassword} style={{ marginTop: 12 }} />
            {!!err && <Text style={styles.err}>{err}</Text>}
            <Button style={{ marginTop: 16 }} onPress={submit} disabled={busy}>
              {busy ? '…' : t('sign_in') || 'Sign in'}
            </Button>
          </CardUI>
          <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkWrap}>
            <Text style={{ color: colors.tint }}>{t('need_account') || 'Create an account'}</Text>
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
