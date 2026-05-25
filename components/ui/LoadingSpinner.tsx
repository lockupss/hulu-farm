import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { ActivityIndicator } from 'react-native-paper'

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | 'medium'
  color?: string
  style?: any
  text?: string
}

export const LoadingSpinner = ({ 
  size = 'medium', 
  color, 
  style, 
  text 
}: LoadingSpinnerProps) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: 20, height: 20 }
      case 'large':
        return { width: 40, height: 40 }
      default:
        return { width: 30, height: 30 }
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.spinnerContainer}>
        <ActivityIndicator
          size={size === 'medium' ? 24 : size === 'large' ? 36 : 18}
          color={color || colors.primary}
          style={[getSizeStyle()]}
        />
        {text && (
          <Text style={styles.loadingText}>{text}</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  spinnerContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
})

export default LoadingSpinner
