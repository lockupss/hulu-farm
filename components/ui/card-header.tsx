import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

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
  header: {
    paddingBottom: 10, // more breathing room
  },

  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827', // strong readable dark
    letterSpacing: 0.3,
    marginBottom: 4,
  },

  desc: {
    fontSize: 14,
    color: '#6b7280', // soft gray
    lineHeight: 20,   // improves readability
  },
})

export default CardHeader