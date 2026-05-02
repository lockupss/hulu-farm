import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

export const Button = ({ children, onPress, variant = 'default', style }: any) => {
  const btnStyle = [
    styles.button,
    variant === 'outline' ? styles.outline : null,
    style,
  ]

  const textStyle = [
    styles.text,
    variant === 'outline' ? styles.textOutline : null,
  ]

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563eb', // modern blue
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',

    // subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },

  outline: {
    backgroundColor: '#ffffff', // cleaner than transparent
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },

  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.4,
  },

  textOutline: {
    color: '#111827',
  },
})

export default Button