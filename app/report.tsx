import { useToast } from '@/components/toast'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { postJSON } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native'

const REASONS = [
  { value: 'spam',            label: 'Spam' },
  { value: 'harassment',      label: 'Harassment' },
  { value: 'misinformation',  label: 'Misinformation' },
  { value: 'inappropriate',   label: 'Inappropriate Content' },
  { value: 'other',           label: 'Other' },
]

export default function ReportScreen() {
  const router = useRouter()
  const { showToast } = useToast()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { token, isSignedIn } = useAuth()

  // Params passed when navigating: target_type, target_id, target_preview
  const params = useLocalSearchParams<{
    target_type: string
    target_id: string
    target_preview: string
  }>()

  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const muted = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'
  const cardBg = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF'
  const border = colorScheme === 'dark' ? '#2C2C2E' : '#E5E7EB'

  const handleSubmit = async () => {
    if (!isSignedIn) {
      router.push('/login')
      return
    }
    if (!reason) {
      showToast('Please select a reason', 'error')
      return
    }
    setBusy(true)
    try {
      await postJSON('/api/v1/reports/', {
        target_type: params.target_type,
        target_id: params.target_id,
        target_preview: params.target_preview || '',
        reason,
        description: description.trim(),
      }, token)
      showToast('Report submitted. Thank you.', 'success')
      router.back()
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit report', 'error')
    } finally {
      setBusy(false)
    }
  }

  const targetLabel =
    params.target_type === 'post' ? 'Post' :
    params.target_type === 'comment' ? 'Comment' : 'User'

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.tint }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Report {targetLabel}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Help us keep the community safe by reporting content that violates our guidelines.
        </Text>
      </View>

      {/* Content preview */}
      {!!params.target_preview && (
        <View style={[styles.previewBox, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.previewLabel, { color: muted }]}>Reported content</Text>
          <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={3}>
            {params.target_preview}
          </Text>
        </View>
      )}

      {/* Reason selector */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Reason *</Text>
        {REASONS.map(r => (
          <TouchableOpacity
            key={r.value}
            style={[
              styles.reasonRow,
              { borderColor: border },
              reason === r.value && { borderColor: colors.tint, backgroundColor: colors.tint + '12' },
            ]}
            onPress={() => setReason(r.value)}
          >
            <View style={[
              styles.radio,
              { borderColor: reason === r.value ? colors.tint : muted },
            ]}>
              {reason === r.value && (
                <View style={[styles.radioDot, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <Text style={[styles.reasonText, { color: colors.text }]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Additional details <Text style={{ color: muted }}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.textArea, { color: colors.text, borderColor: border }]}
          placeholder="Describe the issue..."
          placeholderTextColor={muted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={[styles.charCount, { color: muted }]}>{description.length}/500</Text>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: colors.tint },
          (!reason || busy) && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!reason || busy}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>Submit Report</Text>
        }
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: muted }]}>
        False reports may result in account restrictions. Reports are reviewed by our moderation team.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 16 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  previewBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  previewLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewText: { fontSize: 13, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontSize: 14, fontWeight: '500' },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disclaimer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
})