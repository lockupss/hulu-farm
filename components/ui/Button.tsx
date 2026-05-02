import React from 'react'
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native'

export const Button = ({ children, onPress, variant = 'default', style, disabled = false, loading = false, fullWidth = false }: any) => {
  const btnStyle = [
    styles.button,
    variant === 'outline' ? styles.outline : null,
    fullWidth ? styles.fullWidth : null,
    disabled ? styles.disabled : null,
    style,
  ]

  const textStyle = [
    styles.text,
    variant === 'outline' ? styles.textOutline : null,
  ]

  return (
    <TouchableOpacity
      style={btnStyle}
      onPress={disabled || loading ? undefined : onPress}
      activeOpacity={0.85}
      accessibilityState={{ disabled }}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator color={variant === 'outline' ? '#111827' : '#fff'} style={{ marginRight: 8 }} />
          <Text style={textStyle}>{children}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
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

  fullWidth: { alignSelf: 'stretch' },

  disabled: { opacity: 0.6 },

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