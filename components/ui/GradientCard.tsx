import React from 'react'
import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { LinearGradient } from 'expo-linear-gradient'

export interface GradientCardProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  style?: any
  onPress?: () => void
}

export const GradientCard = ({ 
  children, 
  variant = 'primary', 
  style, 
  onPress 
}: GradientCardProps) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  
  const getGradientColors = () => {
    const gradient = colors.gradient[variant] || colors.gradient.primary
    return Array.isArray(gradient) ? gradient : [gradient[0], gradient[0]]
  }

  return (
    <View style={[styles.container, style, { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }]}>
      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}>
        <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}>
            {children}
          </LinearGradient>
      </TouchableOpacity>
      ) : (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {children}
        </LinearGradient>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  gradient: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
  },
})

export default GradientCard
