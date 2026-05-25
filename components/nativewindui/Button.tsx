import React from 'react'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Button as BaseButton } from '@/components/ui/Button'

// Lightweight wrapper so code that imports from '@/components/nativewindui/Button'
// works without adding Nativewind. It forwards props to the existing Button.
export const Button = ({ children, style, variant, onPress, ...rest }: any) => {
  return (
    <BaseButton variant={variant} onPress={onPress} style={[styles.wrapper, style]} {...rest}>
      {children}
    </BaseButton>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    // keep a minimal, neutral spacing baseline
    paddingVertical: 8,
  },
})

export default Button
