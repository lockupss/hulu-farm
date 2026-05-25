import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import Header from '@/components/header';
import TransactionBanner from '@/components/transaction-banner';
import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/hooks/use-color-scheme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppDataProvider } from '@/lib/app-data';
import { AuthProvider } from '@/lib/auth-context';
import { I18nProvider } from '@/lib/i18n';
import React from 'react';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  )
}

function RootLayoutContent() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const paperTheme = React.useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme
    return {
      ...baseTheme,
      roundness: 12,
      colors: {
        ...baseTheme.colors,
        primary: colors.tint,
        onPrimary: colorScheme === 'dark' ? '#111111' : '#ffffff',
        background: colors.background,
        surface: colors.surface,
        onSurface: colors.text,
        onSurfaceVariant: colors.textMuted,
        outline: colors.border,
        error: colors.danger,
      },
    }
  }, [colorScheme, colors])

  return (
    <PaperProvider theme={paperTheme}>
      <I18nProvider>
        <AuthProvider>
        <ToastProvider>
          <Header />
          <TransactionBanner />
          {/* App-wide data provider for weather/market to keep Home and pages consistent */}
          <AppDataProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="login" options={{ headerShown: true }} />
            <Stack.Screen name="register" options={{ headerShown: true }} />
            <Stack.Screen name="messages" options={{ headerShown: true }} />
            <Stack.Screen name="chat/[threadId]" options={{ headerShown: true }} />
            <Stack.Screen name="user/[userId]" options={{ headerShown: true }} />
          </Stack>
          <StatusBar style="auto" />
          </AppDataProvider>
        </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </PaperProvider>
  )
}
