import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useRNColorScheme } from 'react-native';

type ThemeContextType = { scheme: ColorSchemeName; setScheme: (s: ColorSchemeName) => void }

const ThemeContext = createContext<ThemeContextType>({ scheme: (Appearance.getColorScheme() as ColorSchemeName) ?? 'light', setScheme: () => {} })

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [scheme, setScheme] = useState<ColorSchemeName>((Appearance.getColorScheme() as ColorSchemeName) ?? 'light')

  useEffect(() => {
    const listener = ({ colorScheme }: { colorScheme: ColorSchemeName | null }) => {
      if (colorScheme) setScheme(colorScheme)
    }
    const sub = Appearance.addChangeListener(listener)
    return () => sub.remove()
  }, [])

  return React.createElement(ThemeContext.Provider, { value: { scheme, setScheme } }, children)
}

export function useColorScheme() {
  const ctx = useContext(ThemeContext)
  // If provider is not used, fallback to RN hook
  if (!ctx) return useRNColorScheme() ?? 'light'
  return ctx.scheme
}

export function useSetColorScheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return (s: ColorSchemeName) => {}
  return ctx.setScheme
}

export default useColorScheme
