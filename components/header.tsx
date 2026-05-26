import { Colors } from '@/constants/theme'
import { useColorScheme, useSetColorScheme } from '@/hooks/use-color-scheme'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native'

export default function Header() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()

  const setScheme = useSetColorScheme()

  const toggle = () => setScheme(colorScheme === 'dark' ? 'light' : 'dark')

  let logoSource: any = null
  try {
    // Use a known-good app icon to avoid bundler failures from corrupted assets.
    // If you later want a custom agricultural logo, replace `icon.png` with a valid PNG.
  logoSource = require('@/assets/images/icon.png')
  } catch (err) {
    void err
    logoSource = null
  }

  const { width } = Dimensions.get('window')
  const compact = width < 360

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }] }>
      <View style={styles.left}>
        {logoSource ? (
          <View style={[styles.logoWrap, { backgroundColor: colors.tint }]}>
            <Image source={logoSource} style={[styles.logo, compact ? styles.logoSmall : null]} />
          </View>
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: colors.tint }, compact ? styles.logoSmall : null] }>
            <Text style={{ fontSize: compact ? 14 : 18, color: colors.background }}>🌾</Text>
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { color: colors.text }]}>HuluFarm</Text>
          {!compact && <Text style={[styles.subtitle, { color: colors.textMuted, marginLeft: 0 }]}>Tools for farmers</Text>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={toggle} style={[styles.actionButton, { backgroundColor: colors.surfaceMuted }]} accessibilityLabel="Toggle theme">
          <Text style={{ color: colors.text }}>{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/account')}
          style={[styles.actionButton, { backgroundColor: colors.surfaceMuted }]}
          accessibilityLabel="Account"
        >
          <Text style={{ color: colors.text, fontSize: 18 }}>👤</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { height: 76, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center' },
  logoWrap: { width: 40, height: 40, marginRight: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 28, height: 28 },
  logoSmall: { width: 28, height: 28, marginRight: 8 },
  logoFallback: { width: 40, height: 40, marginRight: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  actionButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
})
