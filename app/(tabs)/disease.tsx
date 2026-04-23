import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import diseaseData from '../../data/disease.json'
import Card from '@/components/ui/Card'
import { CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function Disease() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Disease Detection</Text></View>
      <FlatList
        data={diseaseData}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <Text style={styles.conf}>Confidence: {item.confidence}</Text>
            <Text style={styles.rec}>{item.recommendation}</Text>
          </Card>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  conf: { marginTop: 8, fontWeight: '600' },
  rec: { marginTop: 4, color: '#6b7280' }
})
