import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { FAB as PaperFAB } from 'react-native-paper'

interface FloatingActionButtonProps {
  icon: string
  onPress: () => void
  style?: any
  visible?: boolean
  animated?: boolean
  disabled?: boolean
}

export const FloatingActionButton = ({ 
  icon, 
  onPress, 
  style, 
  visible = true,
  animated = false,
  disabled = false
}: FloatingActionButtonProps) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  if (!animated && !visible) return null
  return (
    <View style={[styles.container, style]}>
      <PaperFAB
        icon={icon}
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.fab,
          !disabled && { boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' },
          style,
        ]}
        color="#ffffff"
        size="medium"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  fab: {
    elevation: 8,
  },
})

export default FloatingActionButton
