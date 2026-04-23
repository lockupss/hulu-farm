import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import marketData from '../../data/market.json'
import Card from '@/components/ui/Card'
import { CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function Market() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Market Price Updates</Text></View>
      <FlatList
        data={marketData}
        keyExtractor={(i) => i.name}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <View style={styles.row}><Text style={styles.price}>{item.price}</Text><Text style={styles.change}>{item.change}</Text></View>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  price: { fontWeight: '700' },
  change: { color: 'green' }
})
