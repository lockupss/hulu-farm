import { Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAdmin, loading } = useAuth();

  // ── Wait for auth to resolve before deciding which nav to render ──
  // This prevents a flash where isAdmin is false during hydration,
  // which would lock Expo Router into the user tab tree.
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const tabBarStyle = {
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
  };

  const sharedScreenOptions = {
    tabBarActiveTintColor: colors.primary,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarStyle,
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const, marginTop: 4 },
    tabBarInactiveTintColor: colors.tabIconDefault,
    tabBarIconStyle: { marginBottom: 2 },
  };

  // ── ADMIN tab bar ─────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <Tabs
        initialRouteName="admin-home"
        screenOptions={sharedScreenOptions}
      >
        <Tabs.Screen
          name="admin-home"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="shield.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin-alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="exclamationmark.triangle.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="admin-reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="flag.fill" color={color} />,
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
          name="settings"
          options={{
            title: t('settings'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          }}
        />
        {/* All user-only screens hidden from admin nav */}
        <Tabs.Screen name="index"         options={{ href: null }} />
        <Tabs.Screen name="weather"       options={{ href: null }} />
        <Tabs.Screen name="market"        options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="account"       options={{ href: null }} />
      </Tabs>
    );
  }

  // ── REGULAR USER tab bar ──────────────────────────────────────────
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={sharedScreenOptions}
    >
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
      {/* Admin-only screens completely hidden from users */}
      <Tabs.Screen name="admin-home"    options={{ href: null }} />
      <Tabs.Screen name="admin-alerts"  options={{ href: null }} />
      <Tabs.Screen name="admin-reports" options={{ href: null }} />
      <Tabs.Screen name="account"       options={{ href: null }} />
    </Tabs>
  );
}