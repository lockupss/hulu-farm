import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export const CardHeader = ({ children, style }: any) => {
  return <View style={[styles.header, style]}>{children}</View>
}

export const CardTitle = ({ children, style }: any) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  return <Text style={[styles.title, { color: colors.text }, style]}>{children}</Text>
}

export const CardDescription = ({ children, style }: any) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  return <Text style={[styles.desc, { color: colors.textMuted }, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10, // more breathing room
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },

  desc: {
    fontSize: 14,
    lineHeight: 20,
  },
})

export default CardHeader