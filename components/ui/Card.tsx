import React from 'react'
import { View, StyleSheet } from 'react-native'

export const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
})

export default Card
