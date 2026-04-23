import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import weatherData from '../../data/weather.json'
import Card from '@/components/ui/Card'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

export default function Weather() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weather Alerts & Forecasts</Text>
        <Text style={styles.subtitle}>Hyper-localized weather information for your farm</Text>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'current'}
        renderItem={() => (
          <Card style={{ margin: 16 }}>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
            </CardHeader>
            <View style={{ paddingTop: 8 }}>
              <View style={styles.currentRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.emoji}>☁️</Text>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.temp}>28°C</Text>
                    <Text style={styles.muted}>Partly Cloudy</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.muted}>Addis Ababa Region</Text>
                  <Text style={styles.muted}>Last updated 10 min ago</Text>
                </View>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}><Text style={styles.metricLabel}>💧 Humidity</Text><Text style={styles.metricValue}>65%</Text></View>
                <View style={styles.metric}><Text style={styles.metricLabel}>💨 Wind</Text><Text style={styles.metricValue}>12 km/h</Text></View>
                <View style={styles.metric}><Text style={styles.metricLabel}>👁️ Visibility</Text><Text style={styles.metricValue}>10 km</Text></View>
                <View style={styles.metric}><Text style={styles.metricLabel}>Pressure</Text><Text style={styles.metricValue}>1013 mb</Text></View>
              </View>
            </View>
          </Card>
        )}
      />

      <Card style={{ margin: 16 }}>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <View style={{ paddingTop: 8 }}>
          {weatherData.alerts.map((a: any, i: number) => (
            <View key={i} style={[styles.alertItem, { backgroundColor: a.type === 'alert' ? '#fff7ed' : '#f8fafc' }]}>
              <Text style={{ fontWeight: '600' }}>{a.title}</Text>
              <Text style={styles.muted}>{a.detail}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={{ margin: 16 }}>
        <CardHeader>
          <CardTitle>7-Day Weather Forecast</CardTitle>
          <CardDescription>Hyper-localized predictions for your farm location</CardDescription>
        </CardHeader>
        <View style={{ paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {weatherData.forecast.map((day: string, i: number) => (
              <View key={i} style={styles.forecastItem}>
                <Text style={{ fontWeight: '600' }}>{day}</Text>
                <Text style={{ fontSize: 20, marginTop: 6 }}>{i % 2 === 0 ? '☀️' : '🌧️'}</Text>
                <Text style={styles.muted}>{28 - i}°C</Text>
                <Text style={styles.mutedSmall}>{30 + i * 5}% humidity</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginTop: 6 },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emoji: { fontSize: 40 },
  temp: { fontSize: 32, fontWeight: '800' },
  muted: { color: '#6b7280' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metric: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  alertItem: { padding: 10, borderRadius: 8, marginBottom: 8 },
  forecastItem: { alignItems: 'center', padding: 8, backgroundColor: '#f8fafc', borderRadius: 8, flex: 1, marginHorizontal: 4 },
  mutedSmall: { color: '#6b7280', fontSize: 12, marginTop: 6 }
})
