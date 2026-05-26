import HelpModal from '@/components/help-modal'
import Sparkline from '@/components/sparkline'
import { useToast } from '@/components/toast'
import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useAppData } from '@/lib/app-data'
import type { Lang } from '@/lib/i18n'
import { useTranslation } from '@/lib/i18n'
import { loadItem, saveItem } from '@/lib/storage'
import { fetchWeather, loadCachedWeather } from '@/lib/weather'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'

export default function Weather() {
  const { width } = useWindowDimensions()
  const compact = width < 390
  const { t, lang } = useTranslation()
  const dateLocale = localeForLang(lang)
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(true)
  const { weather, refreshWeather } = useAppData()
  const [localWeather, setLocalWeather] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const { showToast } = useToast()
  const geoWatchIdRef = useRef<number | null>(null)
  const locWatchRemoverRef = useRef<(() => void) | null>(null)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const updateOnline = () => {
      try {
        if (typeof navigator !== 'undefined' && typeof (navigator as any).onLine === 'boolean') {
          const now = (navigator as any).onLine
          const prev = isOnline
          setIsOnline(now)
          // Auto-refresh when coming back online
          if (now && prev === false) {
            try { showToast(t('back_online')) } catch { /* ignore */ }
            retryFetch(false, true) // silent background refresh
          } else if (!now && prev !== false) {
            try { showToast(t('you_are_offline')) } catch { /* ignore */ }
          }
        }
      } catch {
        // ignore online-detection errors
      }
    }

    const init = async () => {
      try {
        // ── INSTANT CACHE LOAD ──
        // Load cached data FIRST so the UI renders immediately
        const cached = await loadCachedWeather()
        if (cached && mounted) {
          setLocalWeather(cached)
          setLoading(false) // show cached data instantly, no spinner
        }

        const shown = await loadItem('weather_onboard_shown')
        if (!shown && mounted) setHelpOpen(true)

        // ── BACKGROUND NETWORK FETCH ──
        let lat: number | undefined
        let lon: number | undefined
        try {
          const Location = await import('expo-location')
          const { status } = await Location.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
            lat = pos.coords.latitude
            lon = pos.coords.longitude
            try {
              const subscription = await Location.watchPositionAsync({ distanceInterval: 50, accuracy: Location.Accuracy.Highest }, async (p: any) => {
                try {
                  const nw = await fetchWeather(p.coords.latitude, p.coords.longitude)
                  if (mounted) setLocalWeather(nw)
                } catch {
                  // ignore per-update errors
                }
              })
              locWatchRemoverRef.current = () => subscription.remove()
            } catch {
              // ignore watch errors
            }
          }
        } catch {
          // fallback to browser geolocation
          try {
            const pos = await new Promise<any>((resolve, reject) => {
              if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
                ;(navigator as any).geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
              } else reject(new Error('Geolocation not available'))
            })
            lat = pos.coords.latitude
            lon = pos.coords.longitude
          } catch {
            // unable to determine location
          }
        }

        if (lat != null && lon != null) {
          try {
            const w = await fetchWeather(lat, lon)
            if (mounted) {
              setLocalWeather(w)
              hasFetchedRef.current = true
            }
          } catch {
            // Network fetch failed — cached data is already showing, no error needed
            if (mounted && !cached) {
              setError(t('weather_update_failed'))
            }
          }
        } else {
          if (mounted && !cached) {
            setError(t('unable_obtain_location'))
          }
        }
      } catch {
        // overall init failure
      } finally {
        if (mounted) setLoading(false)
      }
    }

    updateOnline()
    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', updateOnline)
        window.addEventListener('offline', updateOnline)
      }
    } catch {
      // ignore
    }

    init()
    const capturedGeoWatchId = geoWatchIdRef.current
    return () => {
      mounted = false
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('online', updateOnline)
          window.removeEventListener('offline', updateOnline)
        }
      } catch {
        // ignore
      }
      try {
        if (capturedGeoWatchId && (navigator as any).geolocation.clearWatch) (navigator as any).geolocation.clearWatch(capturedGeoWatchId)
      } catch {
        // ignore
      }
      try {
        if (locWatchRemoverRef.current) locWatchRemoverRef.current()
      } catch {
        // ignore
      }
    }
  }, [])

  // Silent background retry (or user-initiated pull-to-refresh)
  const retryFetch = async (isPullToRefresh = false, isSilent = false) => {
    if (isPullToRefresh) {
      setRefreshing(true)
    } else if (!isSilent) {
      setLoading(true)
    }
    setError(null)
    try {
      let lat: number | undefined
      let lon: number | undefined
      try {
        const Location = await import('expo-location')
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          if (localWeather || weather) {
            showToast(t('location_denied'))
          } else {
            setError(t('location_denied'))
          }
          return
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      } catch {
        // fallback navigator
        const getPos = () => new Promise<GeolocationPosition>((resolve, reject) => {
          if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
            ;(navigator as any).geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
          } else {
            reject(new Error('Geolocation not available'))
          }
        })
        try {
          const pos = await getPos()
          lat = pos.coords.latitude
          lon = pos.coords.longitude
        } catch {
          // unable to determine location
        }
      }
      if (lat != null && lon != null) {
        const nw = await fetchWeather(lat, lon)
        setLocalWeather(nw)
        // also refresh shared provider state if possible
        try { await refreshWeather() } catch {}
        if (!isSilent) {
          showToast(t('back_online_updated_weather'))
        }
      } else {
        throw new Error('Location not available')
      }
    } catch {
      if (!isSilent) {
        if (localWeather || weather) {
          showToast(t('failed_refresh_weather'))
        } else {
          setError(t('weather_update_failed'))
        }
      }
    } finally {
      if (!isSilent) setLoading(false)
      setRefreshing(false)
    }
  }

  const w = localWeather || weather
  const lastUpdatedTime = w?.fetchedAt ? new Date(w.fetchedAt).toLocaleTimeString(dateLocale) : null
  const lastUpdatedDate = w?.fetchedAt ? new Date(w.fetchedAt).toLocaleDateString(dateLocale) : null

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.headerLarge}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.titleLarge, { color: colors.text }]}>{t('weather')}</Text>
            <Text style={[styles.placeText, { color: colors.icon }]}>{w?.place || t('your_location')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: isOnline === false ? '#F59E0B' : isOnline === true ? '#10B981' : '#9CA3AF' }]} />
            <Text style={{ marginLeft: 8, color: colors.icon }}>{isOnline === null ? t('unknown') : isOnline ? t('online') : t('offline')}</Text>
          </View>
        </View>
      </View>

      {loading && !w ? (
        <View style={{ padding: 16, alignItems: 'center' }}><ActivityIndicator /></View>
      ) : error && !w ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.tint }]} onPress={() => retryFetch()}>
            <Text style={[styles.retryBtnText, { color: colors.tint }]}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : !w ? (
        <View style={{ padding: 16 }}><Text>{t('no_weather_data')}</Text></View>
      ) : (
        <FlatList
          data={[w]}
          keyExtractor={() => 'current'}
          refreshing={refreshing}
          onRefresh={() => retryFetch(true)}
          renderItem={({ item }) => (
            <View style={{ marginHorizontal: 16 }}>
              <View style={[styles.currentCard, { backgroundColor: colors.background, borderColor: '#E6F4EA' }]}>
                <View style={{ padding: 18, alignItems: 'center' }}>
                  <Text style={styles.emojiLarge}>{getEmojiForWeather(item.data.current_weather?.weathercode)}</Text>
                  <Text style={styles.tempLarge}>{Math.round(item.data.current_weather?.temperature)}°C</Text>
                  <Text style={styles.descLarge}>{t(weatherDescriptionKey(item.data.current_weather?.weathercode))}</Text>
                  {lastUpdatedTime && (
                    <Text style={styles.updatedText}>{t('updated_at')} {lastUpdatedTime}{lastUpdatedDate ? ` · ${lastUpdatedDate}` : ''}</Text>
                  )}

                  <View style={styles.metricsStack}>
                    <View style={styles.metricRowBig}>
                      <View style={styles.metricBig}><Text style={styles.metricEmoji}>💧</Text><Text style={styles.metricValueBig}>{item.data.current_weather?.relativehumidity ?? '--'}%</Text><Text style={styles.metricLabelBig}>{t('humidity')}</Text></View>
                      <View style={styles.metricBig}><Text style={styles.metricEmoji}>💨</Text><Text style={styles.metricValueBig}>{Math.round(item.data.current_weather?.windspeed ?? 0)} km/h</Text><Text style={styles.metricLabelBig}>{t('wind')}</Text></View>
                    </View>
                    <View style={styles.metricRowBig}>
                      <View style={styles.metricBig}><Text style={styles.metricEmoji}>🌁</Text><Text style={styles.metricValueBig}>{item.data.current_weather?.visibility ?? '10 km'}</Text><Text style={styles.metricLabelBig}>{t('visibility')}</Text></View>
                      <View style={styles.metricBig}><Text style={styles.metricEmoji}>⚖️</Text><Text style={styles.metricValueBig}>{item.data.current_weather?.pressure ?? '—'}</Text><Text style={styles.metricLabelBig}>{t('pressure')}</Text></View>
                    </View>
                  </View>
                </View>
              </View>

              <CardUI style={{ marginTop: 12 }}>
                <CardHeader>
                  <CardTitle>{t('active_alerts')}</CardTitle>
                </CardHeader>
                <View style={{ paddingTop: 8 }}>
                  {(item && item.alerts && item.alerts.length) ? (
                    item.alerts.map((a: any) => (
                      <View key={a.id || a.title} style={[styles.alertItem, { backgroundColor: a.type === 'alert' ? '#fff7ed' : '#f8fafc' }]}>
                        <Text style={{ fontWeight: '600' }}>{a.title}</Text>
                        <Text style={styles.muted}>{a.detail}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.muted}>{t('no_active_alerts')}</Text>
                  )}
                </View>
              </CardUI>

              <CardUI style={{ marginTop: 12 }}>
                <CardHeader>
                  <CardTitle>{t('forecast_7day')}</CardTitle>
                  <CardDescription>{t('forecast_sub')}</CardDescription>
                </CardHeader>
                <View style={{ paddingTop: 8 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.forecastScroll}>
                      {(item && item.data && item.data.daily && item.data.daily.time || []).map((day: string, i: number) => (
                        <View key={i} style={styles.forecastItem}>
                          <Text style={{ fontWeight: '600' }}>{new Date(day).toLocaleDateString(dateLocale, { weekday: 'short' })}</Text>
                          <Text style={{ fontSize: 20, marginTop: 6 }}>{getEmojiForWeather(item.data.daily.weathercode?.[i])}</Text>
                          <Text style={styles.muted}>{Math.round(item.data.daily.temperature_2m_max[i])}° / {Math.round(item.data.daily.temperature_2m_min[i])}°</Text>
                        </View>
                      ))}
                    </ScrollView>
                    <View style={{ padding: 12 }}>
                      <Sparkline values={(item && item.data && item.data.daily && item.data.daily.temperature_2m_max) || []} />
                    </View>
                </View>
              </CardUI>
            </View>
          )}
        />
      )}

  {helpOpen && <HelpModal visible={helpOpen} onClose={async () => { setHelpOpen(false); try { await saveItem('weather_onboard_shown', true) } catch { } }} />}
    </View>
  )
}

// render HelpModal sibling
// Help modal is rendered inside the main Weather component

function getEmojiForWeather(code: number | undefined) {
  if (code == null) return '❓'
  // Simplified mapping: per WMO weather codes
  if (code >= 0 && code <= 3) return '☀️'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌦️'
  if (code >= 80 && code <= 99) return '🌧️'
  return '⛅️'
}

function weatherDescriptionKey(code: number | undefined): string {
  if (code == null) return 'weather_desc_unknown'
  if (code >= 0 && code <= 3) return 'weather_desc_clear'
  if (code >= 45 && code <= 48) return 'weather_desc_fog'
  if (code >= 51 && code <= 67) return 'weather_desc_light_precip'
  if (code >= 80 && code <= 99) return 'weather_desc_rain'
  return 'weather_desc_partly_cloudy'
}

function localeForLang(l: Lang): string | undefined {
  switch (l) {
    case 'am':
      return 'am-ET'
    case 'om':
      return 'om-ET'
    case 'ti':
      return 'ti-ER'
    case 'sid':
      return 'sid-ET'
    default:
      return undefined
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  headerLarge: { padding: 18, paddingTop: 20 },
  title: { fontSize: 20, fontWeight: '700' },
  titleLarge: { fontSize: 26, fontWeight: '800' },
  placeText: { fontSize: 14, marginTop: 6 },
  subtitle: { color: '#6b7280', marginTop: 6 },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emoji: { fontSize: 40 },
  emojiLarge: { fontSize: 72 },
  temp: { fontSize: 32, fontWeight: '800' },
  tempLarge: { fontSize: 56, fontWeight: '900', marginTop: 6 },
  descLarge: { color: '#6b7280', marginTop: 6, fontSize: 16 },
  updatedText: { color: '#9CA3AF', marginTop: 6, fontSize: 12 },
  currentCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  muted: { color: '#6b7280' },
  metricsStack: { marginTop: 12, width: '100%' },
  metricRowBig: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metricBig: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 6 },
  metricEmoji: { fontSize: 16 },
  metricValueBig: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  metricLabelBig: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  metricLabel: { fontSize: 12, color: '#6b7280' },
  metricValue: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  alertItem: { padding: 10, borderRadius: 8, marginBottom: 8 },
  forecastItem: { alignItems: 'center', padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, width: 88, marginRight: 8 },
  forecastScroll: { paddingRight: 4 },
  retryBtn: { borderWidth: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  retryBtnText: { fontWeight: '700' },
  mutedSmall: { color: '#6b7280', fontSize: 12, marginTop: 6 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
})
