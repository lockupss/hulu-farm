import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export const CardHeader = ({ children, style }: any) => {
  return <View style={[styles.header, style]}>{children}</View>
}

export const CardTitle = ({ children, style }: any) => (
  <Text style={[styles.title, style]}>{children}</Text>
)

export const CardDescription = ({ children, style }: any) => (
  <Text style={[styles.desc, style]}>{children}</Text>
)

const styles = StyleSheet.create({
  header: { paddingBottom: 6 },
  title: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#6b7280' }
})

export default CardHeader
