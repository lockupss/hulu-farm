import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function Header() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <View style={[styles.container, { backgroundColor: colors.tint }] }>
      <View style={styles.left}>
        <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.logo} />
        <Text style={[styles.title, { color: '#fff' }]}>HuluFarm</Text>
      </View>
      <TouchableOpacity style={styles.bell} accessibilityLabel="Notifications">
        <Text style={{ color: '#fff', fontSize: 18 }}>🔔</Text>
        <View style={styles.dot} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { height: 64, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 28, height: 28, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  bell: { padding: 8 },
  dot: { position: 'absolute', right: 6, top: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff3b30' }
})
