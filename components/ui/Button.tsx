import React from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

export const Button = ({ children, onPress, variant = 'default', style }: any) => {
  const btnStyle = [styles.button, variant === 'outline' ? styles.outline : null, style]
  const textStyle = [styles.text, variant === 'outline' ? styles.textOutline : null]
  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} activeOpacity={0.8}>
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0366d6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  text: { color: '#fff', fontWeight: '600' },
  textOutline: { color: '#374151' },
})

export default Button
