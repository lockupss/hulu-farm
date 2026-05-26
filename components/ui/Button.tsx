import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Button as PaperButton } from 'react-native-paper'

export const Button = ({ 
  children, 
  onPress, 
  variant = 'default', 
  style, 
  disabled = false, 
  loading = false, 
  fullWidth = false,
  size = 'medium'
}: any) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const getButtonStyle = () => {
    switch (variant) {
      case 'destructive':
        return { backgroundColor: colors.danger, borderColor: colors.danger }
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border }
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' }
      case 'secondary':
        return { backgroundColor: colors.secondary, borderColor: colors.secondary }
      case 'success':
        return { backgroundColor: colors.success, borderColor: colors.success }
      default:
        return { backgroundColor: colors.primary, borderColor: colors.primary }
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary
      default:
        return '#ffffff'
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { minHeight: 36, paddingHorizontal: 12 }
      case 'large':
        return { minHeight: 56, paddingHorizontal: 24 }
      default:
        return { minHeight: 48, paddingHorizontal: 16 }
    }
  }

  const buttonStyle = getButtonStyle()
  const textColor = getTextColor()
  const sizeStyle = getSizeStyle()
  const mode = variant === 'outline' || variant === 'ghost' ? 'outlined' : 'contained'

  return (
    <View 
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.border },
        !disabled && { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' },
        style,
      ]}
    >
      <PaperButton
        mode={mode}
        onPress={disabled || loading ? undefined : onPress}
        disabled={disabled}
        loading={loading}
        buttonColor={buttonStyle.backgroundColor}
        textColor={disabled ? colors.textMuted : textColor}
        contentStyle={styles.content}
        theme={{
          colors: {
            primary: colors.primary,
            outline: colors.border,
            onSurfaceVariant: colors.textMuted,
          },
          roundness: 12,
        }}>
        {children}
      </PaperButton>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  content: { 
    minHeight: 48, 
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },

  fullWidth: { alignSelf: 'stretch' },

  disabled: { 
    opacity: 0.5,
    elevation: 0,
  },
})

export default Button