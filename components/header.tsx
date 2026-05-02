import { Colors } from '@/constants/theme'
import { useColorScheme, useSetColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native'

export default function Header() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

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
    <View style={[styles.container, { backgroundColor: colors.tint }] }>
      <View style={styles.left}>
        {logoSource ? (
          <Image source={logoSource} style={[styles.logo, compact ? styles.logoSmall : null]} />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: colors.background }, compact ? styles.logoSmall : null] }>
            <Text style={{ fontSize: compact ? 14 : 18 }}>🌾</Text>
          </View>
        )}
        <View style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { color: '#fff' }]}>HuluFarm</Text>
          {!compact && <Text style={[styles.subtitle, { color: '#fff', marginLeft: 0 }]}>Tools for farmers</Text>}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={toggle} style={{ marginRight: 12 }} accessibilityLabel="Toggle theme">
          <Text style={{ color: '#fff' }}>{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bell} accessibilityLabel="Farm tools">
          <Text style={{ color: '#fff', fontSize: 18 }}>🚜</Text>
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { height: 64, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 36, height: 36, marginRight: 8 },
  logoSmall: { width: 28, height: 28, marginRight: 8 },
  logoFallback: { width: 36, height: 36, marginRight: 8, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, opacity: 0.9 },
  bell: { padding: 8 },
  dot: { position: 'absolute', right: 6, top: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' }
})
