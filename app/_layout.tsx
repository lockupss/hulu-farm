import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import Header from '@/components/header';
import { ToastProvider } from '@/components/toast';
import { ThemeProvider } from '@/hooks/use-color-scheme';
import { I18nProvider } from '@/lib/i18n'
import { AppDataProvider } from '@/lib/app-data'
import React from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <Header />
          {/* App-wide data provider for weather/market to keep Home and pages consistent */}
          <AppDataProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
          </AppDataProvider>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
