import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { StyleSheet } from 'react-native'
import { TextInput as PaperInput } from 'react-native-paper'

export const Input = ({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  style, 
  ...rest 
}: any) => {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  
  return (
    <PaperInput
      mode="outlined"
      label={label}
      error={!!error}
      style={[
        styles.input,
        {
          backgroundColor: colors.surface,
        },
        error && styles.inputError,
        style,
      ]}
      outlineStyle={[
        { 
          borderRadius: 12, 
          borderColor: error ? colors.danger : colors.border,
          borderWidth: 1.5,
        },
        rest.focused && {
          borderColor: error ? colors.danger : colors.primary,
          borderWidth: 2,
        }
      ]}
      textColor={colors.text}
      placeholderTextColor={colors.textMuted}
      theme={{
        colors: {
          primary: colors.primary,
          outline: colors.border,
          onSurfaceVariant: colors.textMuted,
          error: colors.danger,
          background: colors.surface,
        },
        fonts: {
          regular: {
            fontSize: 16,
          }
        }
      }}
      left={leftIcon ? (
        <PaperInput.Icon 
          icon={leftIcon} 
          color={colors.textMuted}
          size={20}
        />
      ) : undefined}
      right={rightIcon ? (
        <PaperInput.Icon 
          icon={rightIcon} 
          color={colors.textMuted}
          size={20}
        />
      ) : undefined}
      {...rest}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  inputError: {
    backgroundColor: 'transparent',
  },
})

export default Input