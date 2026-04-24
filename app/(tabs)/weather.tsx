import React, { useEffect, useState, useRef } from 'react'
import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { ActivityIndicator, FlatList, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native'
import { fetchWeather, loadCachedWeather } from '@/lib/weather'
import Sparkline from '@/components/sparkline'
import { saveOfflineWeather, loadOfflineWeather, clearOfflineWeather } from '@/lib/weather'

export default function Weather() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [offlineAvailable, setOfflineAvailable] = useState(false)
  const geoWatchIdRef = useRef<number | null>(null)
  const locWatchRemoverRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      // load cached first
      const cached = await loadCachedWeather()
      if (cached && mounted) setWeather(cached)
      const off = await loadOfflineWeather()
      if (off && mounted) setOfflineAvailable(true)

      // get location and subscribe to changes
      try {
        // prefer expo-location when available (better native permissions and watchers)
        let lat, lon
        try {
          const Location = await import('expo-location')
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status !== 'granted') {
            setError('Location permission denied')
            setLoading(false)
            return
          }
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
          // start watching
          try {
            const subscription = await Location.watchPositionAsync({ distanceInterval: 50, accuracy: Location.Accuracy.Highest }, async (p: any) => {
              try {
                const nw = await fetchWeather(p.coords.latitude, p.coords.longitude)
                if (mounted) setWeather(nw)
                // fetch server alerts
                try {
                  const aRes = await fetch(`/api/weather/alerts?lat=${p.coords.latitude}&lon=${p.coords.longitude}`)
                  if (aRes.ok) {
                    const alerts = await aRes.json()
                    if (mounted && alerts) setWeather((prev: any) => ({ ...prev, alerts }))
                  }
                } catch (e) {}
              } catch (e) {}
            })
            // store unsub remover
            locWatchRemoverRef.current = () => subscription.remove()
          } catch (e) {
            // watch not available - ignore
          }
        } catch (e) {
          // fallback to navigator geolocation
          const getPos = () => new Promise<GeolocationPosition>((resolve, reject) => {
            if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
              ;(navigator as any).geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
            } else if ((global as any).navigator && (global as any).navigator.geolocation) {
              ;(global as any).navigator.geolocation.getCurrentPosition(resolve, reject)
            } else {
              reject(new Error('Geolocation not available'))
            }
          })
          const pos = await getPos()
          lat = pos.coords.latitude
          lon = pos.coords.longitude
        }
        const w = await fetchWeather(lat, lon)
        if (mounted) setWeather(w)
        // fetch server-side alerts for this location
        try {
          const aRes = await fetch(`/api/weather/alerts?lat=${lat}&lon=${lon}`)
          if (aRes.ok) {
            const alerts = await aRes.json()
            if (mounted && alerts) setWeather((prev: any) => ({ ...prev, alerts }))
          }
        } catch (e) { /* ignore */ }

        // subscribe to position changes (best-effort)
        try {
          if ((navigator as any).geolocation && (navigator as any).geolocation.watchPosition) {
            const id = (navigator as any).geolocation.watchPosition(async (p: any) => {
              try {
                const nw = await fetchWeather(p.coords.latitude, p.coords.longitude)
                if (mounted) setWeather(nw)
              } catch (e) {
                // ignore
              }
            }, (err: any) => console.warn('watch pos err', err), { enableHighAccuracy: true, distanceFilter: 50 })
            geoWatchIdRef.current = id
          }
        } catch (e) {
          // ignore
        }

      } catch (e: any) {
        setError(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
      try {
        if (geoWatchIdRef.current && (navigator as any).geolocation.clearWatch) (navigator as any).geolocation.clearWatch(geoWatchIdRef.current)
      } catch (e) {}
      try {
        if (locWatchRemoverRef.current) locWatchRemoverRef.current()
      } catch (e) {}
    }
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weather</Text>
        <Text style={[styles.subtitle, { fontSize: 14 }]}>Real-time weather for your location</Text>
      </View>

      {loading ? (
        <View style={{ padding: 16, alignItems: 'center' }}><ActivityIndicator /></View>
      ) : error ? (
        <View style={{ padding: 16 }}><Text style={{ color: 'red' }}>{error}</Text></View>
      ) : !weather ? (
        <View style={{ padding: 16 }}><Text>No weather data available</Text></View>
      ) : (
        <FlatList
          data={[weather]}
          keyExtractor={() => 'current'}
          renderItem={({ item }) => (
            <CardUI style={{ margin: 16 }}>
              <View style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 28, fontWeight: '800' }}>{item.place || 'Your location'}</Text>
                    <Text style={{ color: '#6b7280', marginTop: 4 }}>Last updated {new Date(item.fetchedAt).toLocaleTimeString()}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 42 }}>{getEmojiForWeather(item.data.current_weather?.weathercode)}</Text>
                    <Text style={{ fontSize: 36, fontWeight: '800' }}>{Math.round(item.data.current_weather?.temperature)}°C</Text>
                  </View>
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Wind</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700' }}>{Math.round(item.data.current_weather?.windspeed ?? 0)} km/h</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Humidity</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700' }}>{item.data.current_weather?.relativehumidity ?? '--'}%</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Precip</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700' }}>{Math.round((item.data.daily.precipitation_sum?.[0] || 0) * 10) / 10} mm</Text>
                  </View>
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>7-day temperature</Text>
                    <Sparkline values={(item.data.daily && item.data.daily.temperature_2m_max) || []} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ color: '#6b7280' }}>Actions</Text>
                    <View style={{ marginTop: 8 }}>
                      <Text onPress={async () => { setLoading(true); try { const w = await fetchWeather(item.data.current_weather.latitude, item.data.current_weather.longitude); setWeather(w); } catch (e) { setError('Failed to refresh') } finally { setLoading(false) } }} style={{ color: colors.tint, marginBottom: 8 }}>Refresh</Text>
                      {offlineAvailable ? (
                        <Text onPress={async () => { const off = await loadOfflineWeather(); if (off) setWeather(off); }} style={{ color: colors.tint, marginBottom: 8 }}>Use Offline</Text>
                      ) : null}
                      <Text onPress={async () => { const ok = await saveOfflineWeather(); if (ok) setOfflineAvailable(true) }} style={{ color: colors.tint }}>Save for offline</Text>
                    </View>
                  </View>
                </View>
              </View>
            </CardUI>
          )}
        />
      )}

      <CardUI style={{ margin: 16 }}>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <View style={{ paddingTop: 8 }}>
          {(weather && weather.alerts && weather.alerts.length) ? (
            weather.alerts.map((a: any) => (
              <View key={a.id || a.title} style={[styles.alertItem, { backgroundColor: a.type === 'alert' ? '#fff7ed' : '#f8fafc' }]}>
                <Text style={{ fontWeight: '600' }}>{a.title}</Text>
                <Text style={styles.muted}>{a.detail}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No active alerts near you</Text>
          )}
        </View>
      </CardUI>

      <CardUI style={{ margin: 16 }}>
        <CardHeader>
          <CardTitle>7-Day Weather Forecast</CardTitle>
          <CardDescription>Hyper-localized predictions for your farm location</CardDescription>
        </CardHeader>
        <View style={{ paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {(weather && weather.data && weather.data.daily && weather.data.daily.time || []).map((day: string, i: number) => (
                <View key={i} style={styles.forecastItem}>
                  <Text style={{ fontWeight: '600' }}>{new Date(day).toLocaleDateString()}</Text>
                  <Text style={{ fontSize: 20, marginTop: 6 }}>{getEmojiForWeather(weather.data.daily.weathercode?.[i])}</Text>
                  <Text style={styles.muted}>{Math.round(weather.data.daily.temperature_2m_max[i])}°C / {Math.round(weather.data.daily.temperature_2m_min[i])}°C</Text>
                  <Text style={styles.mutedSmall}>{Math.round((weather.data.daily.precipitation_sum[i] || 0) * 10) / 10} mm</Text>
                </View>
              ))}
            </View>
            <View style={{ padding: 12 }}>
              {/* sparkline for max temperatures */}
              <Sparkline values={(weather && weather.data && weather.data.daily && weather.data.daily.temperature_2m_max) || []} />
            </View>
        </View>
      </CardUI>
    </View>
  )
}

function getEmojiForWeather(code: number | undefined) {
  if (code == null) return '❓'
  // Simplified mapping: per WMO weather codes
  if (code >= 0 && code <= 3) return '☀️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌦️'
  if (code >= 80 && code <= 99) return '🌧️'
  return '⛅️'
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
