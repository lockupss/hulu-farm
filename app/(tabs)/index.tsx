import CardUI from '@/components/ui/Card'
import { CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function Home() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerArea}>
        <Text style={[styles.h1, { color: colors.text }]}>Welcome to HuluFarm</Text>
        <Text style={styles.sub}>{'Your agricultural support platform for real-time insights and community guidance'}</Text>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertText}>⚠️ Heavy rainfall expected in your region within 24 hours. Review your irrigation schedule.</Text>
      </View>

      <View style={styles.statsGrid}>
  <CardUI>
          <CardHeader>
            <CardTitle>Temperature</CardTitle>
          </CardHeader>
          <Text style={styles.big}>28°C</Text>
          <Text style={styles.muted}>Partly cloudy</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>Humidity</CardTitle>
          </CardHeader>
          <Text style={styles.big}>65%</Text>
          <Text style={styles.muted}>Optimal for growth</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>Maize Price</CardTitle>
          </CardHeader>
          <Text style={styles.big}>2,450 Br</Text>
          <Text style={styles.muted}>+5% this week</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>Active Farmers</CardTitle>
          </CardHeader>
          <Text style={styles.big}>12.5K</Text>
          <Text style={styles.muted}>On the platform</Text>
  </CardUI>
      </View>

      <View style={styles.featureGrid}>
  <CardUI>
          <CardHeader>
            <CardTitle>Recent Weather Alerts</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={styles.rowItem}>
              <View>
                <Text style={styles.itemTitle}>Rainfall Warning</Text>
                <Text style={styles.muted}>Heavy rains in 12 hours</Text>
              </View>
              <View style={styles.tag}><Text style={{ color: '#0366d6' }}>Alert</Text></View>
            </View>
            <View style={styles.rowItem}>
              <View>
                <Text style={styles.itemTitle}>Temperature Drop</Text>
                <Text style={styles.muted}>Expected 5°C decrease</Text>
              </View>
              <View style={styles.tagSecondary}><Text style={{ color: '#6b7280' }}>Info</Text></View>
            </View>
          </View>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>Market Price Updates</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={styles.rowItemBetween}><Text>Maize</Text><Text style={{ fontWeight: '700' }}>2,450 Br <Text style={{ color: 'green' }}>↑5%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>Wheat</Text><Text style={{ fontWeight: '700' }}>3,100 Br <Text style={{ color: 'green' }}>↑2%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>Teff</Text><Text style={{ fontWeight: '700' }}>5,200 Br <Text style={{ color: 'red' }}>↓3%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>Beans</Text><Text style={{ fontWeight: '700' }}>4,800 Br <Text style={{ color: 'green' }}>↑1%</Text></Text></View>
          </View>
  </CardUI>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { padding: 16 },
  h1: { fontSize: 26, fontWeight: '800' },
  sub: { color: '#6b7280', marginTop: 8 },
  alertBox: { margin: 16, padding: 12, backgroundColor: '#fff3f0', borderRadius: 8 },
  alertText: { color: '#b91c1c' },
  statsGrid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  big: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  muted: { color: '#6b7280', marginTop: 4 },
  featureGrid: { padding: 16 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  rowItemBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb' },
  itemTitle: { fontWeight: '600' },
  tag: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagSecondary: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
})
