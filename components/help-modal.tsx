import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/lib/i18n';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scheme = useColorScheme()
  const colors = Colors[scheme ?? 'light']
  const { t } = useTranslation()
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background }]}> 
          <Text style={[styles.title, { color: colors.text }]}>{t('offline_help_title')}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{t('offline_help_line1')}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{t('offline_help_line2')}</Text>
          <Text style={[styles.body, { color: colors.text }]}>{t('offline_help_line3')}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: colors.tint }]}> 
            <Text style={{ color: '#fff', fontWeight: '700' }}>{t('got_it')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '86%', padding: 16, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 14, marginBottom: 8 },
  button: { marginTop: 12, paddingVertical: 10, alignItems: 'center', borderRadius: 8 }
})
