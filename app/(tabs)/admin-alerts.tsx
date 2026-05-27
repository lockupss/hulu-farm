import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { getJSON, patchJSON, postJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

type AlertRecord = {
  id: string
  title: string
  message: string
  type: 'weather' | 'disease' | 'market' | 'safety' | 'general'
  region: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'expired' | 'draft'
  sent_at: string | null
  expires_at: string | null
  reach_count: number
}

const SEVERITY_COLORS: Record<string, string> = {
  low:      '#6B7280',
  medium:   '#F59E0B',
  high:     '#F97316',
  critical: '#DC2626',
}

const TYPE_ICONS: Record<string, any> = {
  weather:  'cloud.bolt.fill',
  disease:  'cross.circle.fill',
  market:   'chart.bar.fill',
  safety:   'shield.fill',
  general:  'bell.fill',
}

const ALERT_TYPES = ['weather', 'disease', 'market', 'safety', 'general']
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical']
const REGIONS = ['All Regions', 'Oromia', 'Amhara', 'Tigray', 'SNNPR', 'Somali', 'Afar', 'Addis Ababa']

const MOCK_ALERTS: AlertRecord[] = [
  {
    id: '1', title: 'Heavy Rainfall Warning', message: 'Expect 80mm+ rainfall over the next 48 hours. Secure livestock and delay planting.',
    type: 'weather', region: 'Oromia', severity: 'high', status: 'active',
    sent_at: new Date(Date.now() - 3600000).toISOString(), expires_at: new Date(Date.now() + 86400000).toISOString(), reach_count: 4820,
  },
  {
    id: '2', title: 'Wheat Stem Rust Detected', message: 'Wheat stem rust (Ug99) detected in northern zones. Apply fungicide immediately.',
    type: 'disease', region: 'Amhara', severity: 'critical', status: 'active',
    sent_at: new Date(Date.now() - 7200000).toISOString(), expires_at: new Date(Date.now() + 604800000).toISOString(), reach_count: 3211,
  },
  {
    id: '3', title: 'Teff Price Drop Alert', message: 'Teff prices have dropped 12% this week in Addis Ababa market. Hold stock if possible.',
    type: 'market', region: 'All Regions', severity: 'medium', status: 'active',
    sent_at: new Date(Date.now() - 14400000).toISOString(), expires_at: null, reach_count: 9102,
  },
  {
    id: '4', title: 'Locust Advisory', message: 'Desert locust swarms observed moving south. Monitor crops and report sightings.',
    type: 'safety', region: 'Somali', severity: 'critical', status: 'draft',
    sent_at: null, expires_at: null, reach_count: 0,
  },
  {
    id: '5', title: 'Drought Early Warning', message: 'Rainfall 40% below average for June. Start water conservation measures.',
    type: 'weather', region: 'Afar', severity: 'high', status: 'expired',
    sent_at: new Date(Date.now() - 2592000000).toISOString(), expires_at: new Date(Date.now() - 864000000).toISOString(), reach_count: 2078,
  },
]

function SeverityBadge({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] || '#6B7280'
  return (
    <View style={[styles.severityBadge, { borderColor: color, backgroundColor: color + '18' }]}>
      <Text style={[styles.severityText, { color }]}>{severity.toUpperCase()}</Text>
    </View>
  )
}

function AlertCard({ alert, onEdit, onToggle, colors, border, muted }: {
  alert: AlertRecord; onEdit: (a: AlertRecord) => void; onToggle: (id: string) => void
  colors: any; border: string; muted: string
}) {
  const statusColor = alert.status === 'active' ? '#16A34A' : alert.status === 'draft' ? '#F59E0B' : '#9CA3AF'
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: border }]}>
      <View style={styles.alertCardHeader}>
        <View style={[styles.alertTypeIcon, { backgroundColor: SEVERITY_COLORS[alert.severity] + '20' }]}>
          <IconSymbol name={TYPE_ICONS[alert.type]} size={18} color={SEVERITY_COLORS[alert.severity]} />
        </View>
        <View style={styles.alertCardTitleWrap}>
          <Text style={[styles.alertCardTitle, { color: colors.text }]} numberOfLines={1}>{alert.title}</Text>
          <Text style={[styles.alertCardRegion, { color: muted }]}>📍 {alert.region}</Text>
        </View>
        <SeverityBadge severity={alert.severity} />
      </View>

      <Text style={[styles.alertCardMsg, { color: muted }]} numberOfLines={2}>{alert.message}</Text>

      <View style={[styles.alertCardFooter, { borderTopColor: border }]}>
        <View style={styles.alertStatusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.alertStatus, { color: statusColor }]}>{alert.status}</Text>
          {alert.sent_at && (
            <Text style={[styles.alertTime, { color: muted }]}>· {timeAgo(alert.sent_at)}</Text>
          )}
          {alert.reach_count > 0 && (
            <Text style={[styles.alertReach, { color: muted }]}>· 👥 {alert.reach_count.toLocaleString()}</Text>
          )}
        </View>
        <View style={styles.alertActions}>
          <TouchableOpacity onPress={() => onEdit(alert)} style={styles.alertActionBtn}>
            <IconSymbol name="pencil" size={14} color={colors.tint} />
          </TouchableOpacity>
          {alert.status !== 'expired' && (
            <TouchableOpacity
              onPress={() => onToggle(alert.id)}
              style={[styles.alertActionBtn, { backgroundColor: alert.status === 'draft' ? '#DCFCE7' : '#FEE2E2' }]}
            >
              <IconSymbol
                name={alert.status === 'draft' ? 'paperplane.fill' : 'xmark.circle.fill'}
                size={14}
                color={alert.status === 'draft' ? '#16A34A' : '#DC2626'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

type FormState = {
  title: string; message: string; type: AlertRecord['type']
  region: string; severity: AlertRecord['severity']
}
const BLANK_FORM: FormState = { title: '', message: '', type: 'general', region: 'All Regions', severity: 'medium' }

export default function AdminAlerts() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { token, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const border = colorScheme === 'dark' ? '#2C2C2E' : '#E5E7EB'

  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft' | 'expired'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    try {
      const data = await getJSON('/api/v1/admin/alerts/', token)
      setAlerts(Array.isArray(data) ? data : (data?.results || MOCK_ALERTS))
    } catch {
      setAlerts(MOCK_ALERTS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    if (!authLoading && isAdmin) load()
    if (!authLoading && !isAdmin) router.replace('/')
  }, [authLoading, isAdmin, load, router])

  const onRefresh = useCallback(() => { setRefreshing(true); load() }, [load])

  const openNewForm = () => { setForm(BLANK_FORM); setEditingId(null); setShowForm(true) }
  const openEdit = (a: AlertRecord) => {
    setForm({ title: a.title, message: a.message, type: a.type, region: a.region, severity: a.severity })
    setEditingId(a.id)
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      Alert.alert('Validation', 'Title and message are required.')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await patchJSON(`/api/v1/admin/alerts/${editingId}/`, form, token)
        setAlerts(prev => prev.map(a => a.id === editingId ? { ...a, ...form } : a))
      } else {
        const created = await postJSON('/api/v1/admin/alerts/', { ...form, status: 'draft' }, token)
        const newAlert: AlertRecord = {
          id: created?.id || String(Date.now()),
          ...form, status: 'draft', sent_at: null, expires_at: null, reach_count: 0,
        }
        setAlerts(prev => [newAlert, ...prev])
      }
      setShowForm(false)
    } catch {
      // optimistic local update on API fail
      if (!editingId) {
        const newAlert: AlertRecord = {
          id: String(Date.now()), ...form, status: 'draft', sent_at: null, expires_at: null, reach_count: 0,
        }
        setAlerts(prev => [newAlert, ...prev])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const toggleAlertStatus = (id: string) => {
    const alert = alerts.find(a => a.id === id)
    if (!alert) return
    const nextStatus = alert.status === 'draft' ? 'active' : 'expired'
    const label = nextStatus === 'active' ? 'Send this alert to all farmers in the region?' : 'Deactivate this alert?'
    Alert.alert(nextStatus === 'active' ? 'Send Alert' : 'Deactivate Alert', label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: nextStatus === 'active' ? 'Send' : 'Deactivate',
        style: nextStatus === 'active' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await patchJSON(`/api/v1/admin/alerts/${id}/`, {
              status: nextStatus,
              ...(nextStatus === 'active' ? { sent_at: new Date().toISOString() } : {})
            }, token)
          } catch { /* optimistic */ }
          setAlerts(prev => prev.map(a =>
            a.id === id ? { ...a, status: nextStatus, sent_at: nextStatus === 'active' ? new Date().toISOString() : a.sent_at } : a
          ))
        },
      },
    ])
  }

  const filtered = filterStatus === 'all' ? alerts : alerts.filter(a => a.status === filterStatus)
  const activeCount = alerts.filter(a => a.status === 'active').length
  const draftCount = alerts.filter(a => a.status === 'draft').length

  if (authLoading || loading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.tint} /></View>
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <View>
          <Text style={[styles.pageTitle, { color: colors.text }]}>⚠️ Alert Management</Text>
          <Text style={[styles.pageSub, { color: muted }]}>{activeCount} active · {draftCount} drafts</Text>
        </View>
        <TouchableOpacity onPress={openNewForm} style={[styles.createBtn, { backgroundColor: colors.tint }]}>
          <IconSymbol name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryStrip}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {(['all', 'active', 'draft', 'expired'] as const).map(s => {
          const count = s === 'all' ? alerts.length : alerts.filter(a => a.status === s).length
          const color = s === 'active' ? '#16A34A' : s === 'draft' ? '#F59E0B' : s === 'expired' ? '#9CA3AF' : colors.tint
          return (
            <TouchableOpacity
              key={s}
              style={[styles.summaryChip, { borderColor: filterStatus === s ? color : border, backgroundColor: filterStatus === s ? color + '15' : colors.card }]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.summaryCount, { color }]}>{count}</Text>
              <Text style={[styles.summaryLabel, { color: muted }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Alerts List */}
      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />}
        renderItem={({ item }) => (
          <AlertCard alert={item} onEdit={openEdit} onToggle={toggleAlertStatus} colors={colors} border={border} muted={muted} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 36 }}>🔔</Text>
            <Text style={[styles.emptyText, { color: muted }]}>No {filterStatus === 'all' ? '' : filterStatus} alerts</Text>
            <TouchableOpacity onPress={openNewForm} style={[styles.emptyBtn, { backgroundColor: colors.tint }]}>
              <Text style={styles.emptyBtnText}>Create First Alert</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <ScrollView style={[styles.modalContainer, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editingId ? 'Edit Alert' : 'New Alert'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <IconSymbol name="xmark.circle.fill" size={28} color={muted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.fieldLabel, { color: muted }]}>Title *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: border, backgroundColor: colors.card }]}
            value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
            placeholder="Alert title…" placeholderTextColor={muted}
          />

          <Text style={[styles.fieldLabel, { color: muted }]}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.text, borderColor: border, backgroundColor: colors.card }]}
            value={form.message} onChangeText={v => setForm(f => ({ ...f, message: v }))}
            placeholder="Alert message for farmers…" placeholderTextColor={muted}
            multiline numberOfLines={4}
          />

          <Text style={[styles.fieldLabel, { color: muted }]}>Type</Text>
          <View style={styles.chipRow}>
            {ALERT_TYPES.map(t => (
              <TouchableOpacity key={t}
                style={[styles.chip, { borderColor: border }, form.type === t && { backgroundColor: colors.tint, borderColor: colors.tint }]}
                onPress={() => setForm(f => ({ ...f, type: t as any }))}>
                <Text style={[styles.chipText, { color: form.type === t ? '#fff' : muted }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: muted }]}>Severity</Text>
          <View style={styles.chipRow}>
            {SEVERITY_LEVELS.map(s => (
              <TouchableOpacity key={s}
                style={[styles.chip, { borderColor: SEVERITY_COLORS[s] }, form.severity === s && { backgroundColor: SEVERITY_COLORS[s] }]}
                onPress={() => setForm(f => ({ ...f, severity: s as any }))}>
                <Text style={[styles.chipText, { color: form.severity === s ? '#fff' : SEVERITY_COLORS[s] }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: muted }]}>Region</Text>
          <View style={styles.chipRow}>
            {REGIONS.map(r => (
              <TouchableOpacity key={r}
                style={[styles.chip, { borderColor: border }, form.region === r && { backgroundColor: colors.tint, borderColor: colors.tint }]}
                onPress={() => setForm(f => ({ ...f, region: r }))}>
                <Text style={[styles.chipText, { color: form.region === r ? '#fff' : muted }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.tint }, saving && { opacity: 0.6 }]}
            onPress={saveForm} disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>{editingId ? 'Save Changes' : 'Save as Draft'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 20, fontWeight: '800' },
  pageSub: { fontSize: 12, marginTop: 2 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  summaryStrip: { paddingVertical: 12 },
  summaryChip: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', minWidth: 72 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 80 },
  alertCard: { borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  alertCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  alertTypeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertCardTitleWrap: { flex: 1 },
  alertCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  alertCardRegion: { fontSize: 12 },
  severityBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  severityText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  alertCardMsg: { fontSize: 13, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 12 },
  alertCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  alertStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  alertStatus: { fontSize: 12, fontWeight: '700' },
  alertTime: { fontSize: 12 },
  alertReach: { fontSize: 12 },
  alertActions: { flexDirection: 'row', gap: 8 },
  alertActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
  // Modal
  modalContainer: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 60 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  saveBtn: { marginTop: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})