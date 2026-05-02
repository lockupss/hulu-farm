import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function TransactionBanner({ message }: { message?: string }) {
  const [visible, setVisible] = React.useState(true)

  if (!visible) return null

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://avatars3.githubusercontent.com/u/17571969?s=400&v=4' }}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={styles.message}>{message || 'There was a problem processing a transaction on your credit card.'}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => setVisible(false)} style={styles.actionButton}>
            <Text style={styles.actionText}>Fix it</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVisible(false)} style={[styles.actionButton, styles.learnMore]}>
            <Text style={[styles.actionText, styles.learnMoreText]}>Learn more</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 12, backgroundColor: '#fffbe6', borderRadius: 8, marginHorizontal: 12, marginTop: 8, alignItems: 'center' },
  icon: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  content: { flex: 1 },
  message: { fontSize: 14, color: '#4b5563' },
  actions: { flexDirection: 'row', marginTop: 8 },
  actionButton: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#fff', marginRight: 8 },
  actionText: { color: '#111827', fontWeight: '600' },
  learnMore: { backgroundColor: 'transparent' },
  learnMoreText: { color: '#0366d6' }
})
