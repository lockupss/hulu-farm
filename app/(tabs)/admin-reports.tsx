import { useToast } from '@/components/toast'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, patchJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator, FlatList, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native'

const STATUS_COLORS: Record<string, string> = {
  pending:   '#F59E0B',
  reviewed:  '#3B82F6',
  resolved:  '#10B981',
  dismissed: '#6B7280',
}

const STATUS_OPTIONS = ['pending', 'reviewed', 'resolved', 'dismissed']
const FILTER_OPTIONS = ['all', 'pending', 'reviewed', 'resolved', 'dismissed']

type Report = {
  id: string
  reporter_name: string
  target_type: string
  target_id: string
  target_preview: string
  reason: string
  description: string
  status: string
  admin_note: string
  reviewer_name: string | null
  created_at: string
}

type Stats = {
  total: number
  pending: number
  reviewed: number
  resolved: number
  dismissed: number
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ReportCard({
  report,
  onUpdate,
  token,
  colors,
  muted,
  border,
  cardBg,
}: {
  report: Report
  onUpdate: (id: string, status: string, note: string) => void
  token: string | null
  colors: any
  muted: string
  border: string
  cardBg: string
}) {
  const { showToast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(report.status)
  const [note, setNote] = useState(report.admin_note || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await patchJSON(`/api/v1/reports/admin/${report.id}/`, { status, admin_note: note }, token)
      onUpdate(report.id, status, note)
      showToast('Report updated', 'success')
      setExpanded(false)
    } catch (e: any) {
      showToast(e?.message || 'Failed to update', 'error')
    } finally {
      setSaving(false)
    }
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <View style={[styles.reportCard, { backgroundColor: cardBg, borderColor: border }]}>
      {/* Header row */}
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] || '#6B7280' }]} />
          <View>
            <Text style={[styles.reportReason, { color: colors.text }]}>
              {report.reason.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
              {'  '}
              <Text style={[styles.reportTarget, { color: muted }]}>
                on {report.target_type}
              </Text>
            </Text>
            <Text style={[styles.reportMeta, { color: muted }]}>
              by {report.reporter_name} · {timeAgo(report.created_at)}
            </Text>
          </View>
        </View>
        <Text style={[styles.chevron, { color: muted }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={[styles.reportDetail, { borderTopColor: border }]}>
          {/* Content preview */}
          {!!report.target_preview && (
            <View style={[styles.previewBox, { borderColor: border }]}>
              <Text style={[styles.previewLabel, { color: muted }]}>Reported content</Text>
              <Text style={[styles.previewText, { color: colors.text }]}>{report.target_preview}</Text>
            </View>
          )}

          {/* Reporter description */}
          {!!report.description && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.fieldLabel, { color: muted }]}>Reporter's note</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{report.description}</Text>
            </View>
          )}

          {/* Target ID */}
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.fieldLabel, { color: muted }]}>Target ID</Text>
            <Text style={[styles.fieldValue, { color: colors.text, fontSize: 11 }]}>{report.target_id}</Text>
          </View>

          {/* Status picker */}
          <Text style={[styles.fieldLabel, { color: muted }]}>Update status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  { borderColor: STATUS_COLORS[s] },
                  status === s && { backgroundColor: STATUS_COLORS[s] },
                ]}
                onPress={() => setStatus(s)}
              >
                <Text style={[
                  styles.statusChipText,
                  { color: status === s ? '#fff' : STATUS_COLORS[s] },
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Admin note */}
          <Text style={[styles.fieldLabel, { color: muted, marginTop: 12 }]}>Admin note</Text>
          <TextInput
            style={[styles.noteInput, { color: colors.text, borderColor: border }]}
            placeholder="Add a note about this report..."
            placeholderTextColor={muted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.tint }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>Save changes</Text>
            }
          </TouchableOpacity>

          {report.reviewer_name && (
            <Text style={[styles.reviewedBy, { color: muted }]}>
              Last reviewed by {report.reviewer_name}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default function AdminReportsScreen() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const router = useRouter()
  const { token, isAdmin, loading: authLoading } = useAuth()

  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'
  const border = colorScheme === 'dark' ? '#2C2C2E' : '#E5E7EB'

  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [reportsData, statsData] = await Promise.all([
        getJSON('/api/v1/reports/admin/', token),
        getJSON('/api/v1/reports/admin/stats/', token),
      ])
      const list = Array.isArray(reportsData) ? reportsData : (reportsData?.results || [])
      setReports(list)
      setStats(statsData)
    } catch (e: any) {
      console.error('Failed to load reports:', e?.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/')
      return
    }
    if (!authLoading && isAdmin) load()
  }, [authLoading, isAdmin, load, router])

  const handleUpdate = (id: string, status: string, note: string) => {
    setReports(prev => prev.map(r =>
      r.id === id ? { ...r, status, admin_note: note } : r
    ))
    if (stats) {
      // recalculate stats locally
      load()
    }
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  if (authLoading || loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  if (!isAdmin) return null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>🚩 Reports</Text>
        <TouchableOpacity onPress={load} style={[styles.refreshBtn, { borderColor: border }]}>
          <Text style={[styles.refreshText, { color: colors.tint }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          <StatCard label="Total" count={stats.total} color="#6B7280" />
          <StatCard label="Pending" count={stats.pending} color={STATUS_COLORS.pending} />
          <StatCard label="Reviewed" count={stats.reviewed} color={STATUS_COLORS.reviewed} />
          <StatCard label="Resolved" count={stats.resolved} color={STATUS_COLORS.resolved} />
          <StatCard label="Dismissed" count={stats.dismissed} color={STATUS_COLORS.dismissed} />
        </ScrollView>
      )}

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              { borderColor: border },
              filter === f && { backgroundColor: colors.tint, borderColor: colors.tint },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, { color: filter === f ? '#fff' : muted }]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reports list */}
      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onUpdate={handleUpdate}
            token={token}
            colors={colors}
            muted={muted}
            border={border}
            cardBg={cardBg}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 32 }}>✅</Text>
            <Text style={[styles.emptyText, { color: muted }]}>
              {filter === 'all' ? 'No reports yet' : `No ${filter} reports`}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: { fontSize: 22, fontWeight: '800' },
  refreshBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  refreshText: { fontSize: 13, fontWeight: '600' },
  statsRow: { marginBottom: 4 },
  statCard: {
    borderLeftWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  statCount: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  filterRow: { marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  reportCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  reportHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  reportReason: { fontSize: 14, fontWeight: '700' },
  reportTarget: { fontSize: 13, fontWeight: '400' },
  reportMeta: { fontSize: 12, marginTop: 2 },
  chevron: { fontSize: 12, marginLeft: 8 },
  reportDetail: { padding: 14, borderTopWidth: 1 },
  previewBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  previewLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewText: { fontSize: 13, lineHeight: 18 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  fieldValue: { fontSize: 13, lineHeight: 18 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statusChip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusChipText: { fontSize: 12, fontWeight: '700' },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewedBy: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 12, fontSize: 15 },
})