import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

export default function HelpModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scheme = useColorScheme()
  const colors = Colors[scheme ?? 'light']
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.background }]}> 
          <Text style={[styles.title, { color: colors.text }]}>Offline Weather — Quick Help</Text>
          <Text style={[styles.body, { color: colors.text }]}>You can save the current weather data to your phone. This lets you view the last saved weather when you are out of mobile coverage.</Text>
          <Text style={[styles.body, { color: colors.text }]}>To use: tap "Save for offline" when you have a connection. Later, tap "Use Offline" to view the saved snapshot.</Text>
          <Text style={[styles.body, { color: colors.text }]}>Saved data is stored only on this device and can be cleared with the "Save for offline" button again.</Text>
          <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: colors.tint }]}> 
            <Text style={{ color: '#fff', fontWeight: '700' }}>Got it</Text>
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
