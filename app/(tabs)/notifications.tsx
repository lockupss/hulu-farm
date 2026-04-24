import React, { useEffect, useState } from 'react'
import CardUI from '@/components/ui/Card'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import notifications from '../../data/notifications.json'
import { getJSON } from '@/lib/api'

export default function Notifications() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<any[]>(notifications)

  useEffect(() => {
    ;(async () => {
      try {
        const n = await getJSON('/api/notifications')
        setNotes(n)
      } catch (e) {
        console.warn('Failed to fetch notifications', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Notifications</Text></View>
      {loading ? (
        <View style={{ padding: 16 }}><Text>Loading...</Text></View>
      ) : (
      <FlatList
        data={notes}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <CardUI>
            <Text>{item.text}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </CardUI>
        )}
      />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  time: { marginTop: 8, color: '#6b7280' }
})
