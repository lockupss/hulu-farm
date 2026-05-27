import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation()
  const colors = Colors[colorScheme ?? 'light']
  const { isAdmin } = useAuth()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: 80,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          elevation: 8,
          zIndex: 100,
          overflow: 'visible' as const,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: t('weather'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cloud.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t('view_market'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('forum'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('alerts') || t('notifications_title'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
      {/* Admin tab — only visible to staff users */}
      <Tabs.Screen
        name="admin-reports"
        options={{
          title: 'Reports',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="flag.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('account_tab') || 'Account',
          href: null,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}