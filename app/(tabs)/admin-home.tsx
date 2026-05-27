import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import GradientCard from '@/components/ui/GradientCard'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors, Typography } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

type PlatformStats = {
  total_users: number
  active_users: number
  total_posts: number
  pending_reports: number
  resolved_reports: number
  new_users_today: number
}

type RecentActivity = {
  id: string
  type: 'new_user' | 'report' | 'post' | 'alert'
  message: string
  time: string
}

const MOCK_STATS: PlatformStats = {
  total_users: 12547,
  active_users: 1832,
  total_posts: 47291,
  pending_reports: 14,
  resolved_reports: 302,
  new_users_today: 48,
}

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: '1', type: 'report', message: 'New spam report on forum post #2841', time: '2m ago' },
  { id: '2', type: 'new_user', message: 'Farmer Dawit Bekele registered', time: '11m ago' },
  { id: '3', type: 'alert', message: 'Weather alert broadcast sent to Oromia region', time: '34m ago' },
  { id: '4', type: 'report', message: 'Misinformation report on post #2839', time: '1h ago' },
  { id: '5', type: 'new_user', message: 'Farmer Tigist Haile registered', time: '2h ago' },
  { id: '6', type: 'post', message: '120 new community posts today', time: '3h ago' },
]

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  const map: Record<string, { icon: any; bg: string; color: string }> = {
    report:   { icon: 'flag.fill',         bg: '#FEF3C7', color: '#D97706' },
    new_user: { icon: 'person.fill.badge.plus', bg: '#DCFCE7', color: '#16A34A' },
    alert:    { icon: 'exclamationmark.triangle.fill', bg: '#FEE2E2', color: '#DC2626' },
    post:     { icon: 'bubble.left.fill',  bg: '#DBEAFE', color: '#2563EB' },
  }
  const { icon, bg, color } = map[type] || map['post']
  return (
    <View style={[styles.activityIcon, { backgroundColor: bg }]}>
      <IconSymbol name={icon} size={16} color={color} />
    </View>
  )
}

export default function AdminHome() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { token, user, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [activity, setActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const border = colorScheme === 'dark' ? '#2C2C2E' : '#E5E7EB'

  const load = useCallback(async () => {
    if (!token) return
    try {
      const [statsData, activityData] = await Promise.allSettled([
        getJSON('/api/v1/admin/stats/', token),
        getJSON('/api/v1/admin/activity/', token),
      ])
      setStats(statsData.status === 'fulfilled' ? statsData.value : MOCK_STATS)
      setActivity(activityData.status === 'fulfilled' && Array.isArray(activityData.value)
        ? activityData.value : MOCK_ACTIVITY)
    } catch {
      setStats(MOCK_STATS)
      setActivity(MOCK_ACTIVITY)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && isAdmin) load()
    if (!authLoading && !isAdmin) router.replace('/')
  }, [authLoading, isAdmin, load, router])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load()
  }, [load])

  if (authLoading || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  const s = stats || MOCK_STATS
  const firstName = user?.displayName?.split(' ')[0] || 'Admin'

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
    >
      {/* Admin Welcome Banner */}
      <GradientCard variant="primary" style={styles.welcomeBanner}>
        <View style={styles.welcomeRow}>
          <View style={styles.adminBadge}>
            <IconSymbol name="shield.fill" size={18} color="#FFFFFF" />
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={styles.welcomeName}>Welcome back, {firstName}</Text>
          <Text style={styles.welcomeSub}>Platform overview · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>
      </GradientCard>

      {/* Key Metrics */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</Text>
      <View style={styles.metricsGrid}>
        {/* Total Users */}
        <CardUI style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <IconSymbol name="person.2.fill" size={20} color="#2563EB" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{s.total_users.toLocaleString()}</Text>
          <Text style={[styles.metricLabel, { color: muted }]}>Total Users</Text>
          <View style={styles.metricBadge}>
            <Text style={styles.metricBadgeText}>+{s.new_users_today} today</Text>
          </View>
        </CardUI>

        {/* Active Users */}
        <CardUI style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <IconSymbol name="antenna.radiowaves.left.and.right" size={20} color="#16A34A" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{s.active_users.toLocaleString()}</Text>
          <Text style={[styles.metricLabel, { color: muted }]}>Active Now</Text>
          <View style={[styles.metricBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.metricBadgeText, { color: '#16A34A' }]}>Live</Text>
          </View>
        </CardUI>

        {/* Pending Reports */}
        <CardUI style={[styles.metricCard, s.pending_reports > 0 && styles.metricCardUrgent]}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <IconSymbol name="flag.fill" size={20} color="#D97706" />
          </View>
          <Text style={[styles.metricValue, { color: s.pending_reports > 0 ? '#D97706' : colors.text }]}>
            {s.pending_reports}
          </Text>
          <Text style={[styles.metricLabel, { color: muted }]}>Pending Reports</Text>
          {s.pending_reports > 0 && (
            <TouchableOpacity onPress={() => router.push('/admin-reports')} style={[styles.metricBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.metricBadgeText, { color: '#D97706' }]}>Review →</Text>
            </TouchableOpacity>
          )}
        </CardUI>

        {/* Total Posts */}
        <CardUI style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#F5F3FF' }]}>
            <IconSymbol name="bubble.left.and.bubble.right.fill" size={20} color="#7C3AED" />
          </View>
          <Text style={[styles.metricValue, { color: colors.text }]}>{s.total_posts.toLocaleString()}</Text>
          <Text style={[styles.metricLabel, { color: muted }]}>Forum Posts</Text>
        </CardUI>
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: border }]}
          onPress={() => router.push('/admin-reports')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <IconSymbol name="flag.fill" size={22} color="#D97706" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Reports</Text>
          {s.pending_reports > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{s.pending_reports}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: border }]}
          onPress={() => router.push('/admin-alerts')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={22} color="#DC2626" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: border }]}
          onPress={() => router.push('/community')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#DBEAFE' }]}>
            <IconSymbol name="person.2.fill" size={22} color="#2563EB" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Community</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: border }]}
          onPress={() => router.push('/market')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <IconSymbol name="chart.bar.fill" size={22} color="#16A34A" />
          </View>
          <Text style={[styles.actionLabel, { color: colors.text }]}>Market</Text>
        </TouchableOpacity>
      </View>

      {/* Reports Resolution Summary */}
      <CardUI variant="info" style={styles.resolutionCard}>
        <CardHeader>
          <CardTitle>Reports Resolution</CardTitle>
          <CardDescription>Overall moderation health</CardDescription>
        </CardHeader>
        <View style={styles.resolutionRow}>
          <View style={styles.resolutionItem}>
            <Text style={[styles.resolutionValue, { color: '#D97706' }]}>{s.pending_reports}</Text>
            <Text style={[styles.resolutionLabel, { color: muted }]}>Pending</Text>
          </View>
          <View style={[styles.resolutionDivider, { backgroundColor: border }]} />
          <View style={styles.resolutionItem}>
            <Text style={[styles.resolutionValue, { color: '#16A34A' }]}>{s.resolved_reports}</Text>
            <Text style={[styles.resolutionLabel, { color: muted }]}>Resolved</Text>
          </View>
          <View style={[styles.resolutionDivider, { backgroundColor: border }]} />
          <View style={styles.resolutionItem}>
            <Text style={[styles.resolutionValue, { color: colors.tint }]}>
              {s.resolved_reports + s.pending_reports > 0
                ? Math.round((s.resolved_reports / (s.resolved_reports + s.pending_reports)) * 100)
                : 0}%
            </Text>
            <Text style={[styles.resolutionLabel, { color: muted }]}>Rate</Text>
          </View>
        </View>
      </CardUI>

      {/* Recent Activity Feed */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
      <CardUI>
        {activity.slice(0, 6).map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.activityItem,
              { borderBottomColor: border },
              idx < activity.length - 1 && styles.activityItemBorder,
            ]}
          >
            <ActivityIcon type={item.type} />
            <View style={styles.activityText}>
              <Text style={[styles.activityMessage, { color: colors.text }]}>{item.message}</Text>
              <Text style={[styles.activityTime, { color: muted }]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </CardUI>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Welcome banner
  welcomeBanner: { marginBottom: 20 },
  welcomeRow: { gap: 6 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adminBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  welcomeName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  // Section titles
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 4, ...Typography.h4 },

  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 0,
  },
  metricCardUrgent: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  metricLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginBottom: 6 },
  metricBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  metricBadgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },

  // Quick Actions
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Resolution
  resolutionCard: { marginBottom: 20 },
  resolutionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 8 },
  resolutionItem: { alignItems: 'center', flex: 1 },
  resolutionValue: { fontSize: 24, fontWeight: '800' },
  resolutionLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  resolutionDivider: { width: 1, height: 40 },

  // Activity Feed
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, gap: 12 },
  activityItemBorder: { borderBottomWidth: 1 },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityText: { flex: 1 },
  activityMessage: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  activityTime: { fontSize: 11, marginTop: 3 },
})