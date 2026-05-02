import React from 'react'
import { StyleSheet, TextInput } from 'react-native'

export const Input = (props: any) => {
  return (
    <TextInput
      style={[styles.input, props.style]}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',

    fontSize: 16,
    color: '#111827',

    // subtle depth (same feel as card/button)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
})

export default Input