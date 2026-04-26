import HelpModal from '@/components/help-modal'
import Sparkline from '@/components/sparkline'
import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { loadItem, saveItem } from '@/lib/storage'
import { fetchWeather, loadCachedWeather, loadOfflineWeather, saveOfflineWeather } from '@/lib/weather'
import { useAppData } from '@/lib/app-data'
import { useToast } from '@/components/toast'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTranslation } from '@/lib/i18n'

export default function Weather() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const [loading, setLoading] = useState(true)
  const { weather, refreshWeather } = useAppData()
  const [localWeather, setLocalWeather] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  // offlineAvailable state removed (unused)
  const [helpOpen, setHelpOpen] = useState(false)
  const { showToast } = useToast()
  const geoWatchIdRef = useRef<number | null>(null)
  const locWatchRemoverRef = useRef<(() => void) | null>(null)
  const [showingOfflineSnapshot, setShowingOfflineSnapshot] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    // Simplified effect: subscribe to online status and load weather for current location.
    let mounted = true
    const updateOnline = () => {
      try {
        if (typeof navigator !== 'undefined' && typeof (navigator as any).onLine === 'boolean') {
          const now = (navigator as any).onLine
          setIsOnline(now)
          if (now !== null) {
            // only notify when the status flips
            try { showToast(now ? t('back_online') : t('you_are_offline')) } catch { /* ignore */ }
          }
        }
      } catch {
        // ignore online-detection errors
      }
    }

    const init = async () => {
      try {
  const cached = await loadCachedWeather()
  if (cached && mounted) setLocalWeather(cached)
        const shown = await loadItem('weather_onboard_shown')
        if (!shown && mounted) setHelpOpen(true)

        // determine location (expo-location preferred)
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
            if (mounted) setLocalWeather(w)
          } catch {
            // try offline snapshot
            try {
              const off = await loadOfflineWeather()
              if (off && mounted) {
                setLocalWeather(off)
                setShowingOfflineSnapshot(true)
                try { showToast(t('showing_offline_snapshot')) } catch {}
              }
            } catch {
              // ignore
            }
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
  }, [showToast, showingOfflineSnapshot, t])

  // retry fetching using current location (expo-location or navigator fallback)
  const retryFetch = async () => {
    setLoading(true)
    setError(null)
    try {
      let lat: number | undefined
      let lon: number | undefined
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
  } catch {
        // fallback navigator
        const getPos = () => new Promise<GeolocationPosition>((resolve, reject) => {
          if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
            ;(navigator as any).geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
          } else {
            reject(new Error('Geolocation not available'))
          }
        })
        const pos = await getPos()
        lat = pos.coords.latitude
        lon = pos.coords.longitude
      }
      if (lat != null && lon != null) {
        const nw = await fetchWeather(lat, lon)
        setLocalWeather(nw)
        // also refresh shared provider state if possible
        try { await refreshWeather() } catch {}
        setShowingOfflineSnapshot(false)
        showToast(t('back_online_updated_weather'))
      }
    } catch {
      // capture error but avoid unused-var lints; set a generic message
      setError('Failed to update weather')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
  {showingOfflineSnapshot && (
        <View style={[styles.offlineBanner, { backgroundColor: '#FFF4E5', borderColor: '#FFDAB9' }]}>
          <Text style={styles.offlineBannerText}>{t('showing_offline_snapshot')}</Text>
          <TouchableOpacity
            style={styles.offlineBannerAction}
            onPress={async () => {
              // Try to obtain current location and refresh weather. Prefer expo-location if available, fall back to navigator.geolocation.
              try {
                // try expo-location first
                try {
                  const Location = await import('expo-location')
                  const { status } = await Location.requestForegroundPermissionsAsync()
                  if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest })
                    const nw = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
                      setLocalWeather(nw)
                    setShowingOfflineSnapshot(false)
                    showToast(t('back_online_updated_weather'))
                    return
                  }
                } catch {
                  // expo-location not available or failed; fallthrough to navigator
                }

                // navigator fallback
                if (typeof navigator !== 'undefined' && (navigator as any).geolocation) {
                  (navigator as any).geolocation.getCurrentPosition(async (p: any) => {
                    try {
                      const nw = await fetchWeather(p.coords.latitude, p.coords.longitude)
                      setLocalWeather(nw)
                      setShowingOfflineSnapshot(false)
                      showToast(t('back_online_updated_weather'))
                    } catch {
                      showToast(t('failed_refresh_weather'))
                    }
                  }, () => { showToast(t('unable_obtain_location')) })
                  return
                }

                showToast(t('unable_obtain_location'))
              } catch {
                // ignore top-level errors
              }
            }}
          >
            <Text style={[styles.offlineBannerActionText, { color: colors.tint }]}>{t('exit_offline')}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.headerLarge}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.titleLarge, { color: colors.text }]}>{t('weather')}</Text>
            <Text style={[styles.placeText, { color: colors.icon }]}>{(localWeather || weather)?.place || t('your_location')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: showingOfflineSnapshot ? '#F59E0B' : isOnline === false ? '#EF4444' : isOnline === true ? '#10B981' : '#9CA3AF' }]} />
            <Text style={{ marginLeft: 8, color: colors.icon }}>{showingOfflineSnapshot ? t('offline_snapshot') : isOnline === null ? t('unknown') : isOnline ? t('online') : t('offline')}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16, alignItems: 'center' }}><ActivityIndicator /></View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.offlineBtn, { borderColor: colors.tint }]} onPress={retryFetch}>
              <Text style={[styles.offlineBtnText, { color: colors.tint }]}>{t('retry')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.offlineBtnFilled, { backgroundColor: colors.tint, marginLeft: 8 }]}
              onPress={async () => {
                try {
                  const off = await loadOfflineWeather()
                  if (off) {
                            setLocalWeather(off)
                    setShowingOfflineSnapshot(true)
                    showToast(t('loaded_saved_offline_weather'))
                  } else {
                    showToast(t('no_offline_snapshot'))
                  }
                } catch {
                  showToast(t('failed_load_offline'))
                }
              }}
            >
              <Text style={[styles.offlineBtnTextFilled]}>{t('use_offline')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !(localWeather || weather) ? (
        <View style={{ padding: 16 }}><Text>{t('no_weather_data')}</Text></View>
      ) : (
        <FlatList
          data={[localWeather || weather]}
          keyExtractor={() => 'current'}
          renderItem={({ item }) => (
            <View style={{ marginHorizontal: 16 }}>
              <View style={[styles.currentCard, { backgroundColor: colors.background, borderColor: '#E6F4EA' }]}>
                <View style={{ padding: 18, alignItems: 'center' }}>
                  <Text style={styles.emojiLarge}>{getEmojiForWeather(item.data.current_weather?.weathercode)}</Text>
                  <Text style={styles.tempLarge}>{Math.round(item.data.current_weather?.temperature)}°C</Text>
                  <Text style={styles.descLarge}>{getDescriptionForCode(item.data.current_weather?.weathercode)}</Text>
                  <Text style={styles.updatedText}>{t('updated_at')} {new Date(item.fetchedAt).toLocaleTimeString()}</Text>

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

                    <View style={styles.offlineRow}>
                    <TouchableOpacity
                      style={[styles.offlineBtn, { borderColor: colors.tint }]}
                      onPress={async () => {
                        try {
                          const ok = await saveOfflineWeather()
                          if (ok) {
                            showToast(t('loaded_saved_offline_weather'))
                          } else {
                            showToast(t('failed_load_offline'))
                          }
                        } catch {
                          showToast(t('failed_load_offline'))
                        }
                      }}
                    >
                      <Text style={[styles.offlineBtnText, { color: colors.tint }]}>{t('save_offline')}</Text>
                    </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.offlineBtnFilled, { backgroundColor: colors.tint }]}
                        onPress={async () => {
                          try {
                            const off = await loadOfflineWeather()
                            if (off) {
                              setLocalWeather(off)
                              setShowingOfflineSnapshot(true)
                              showToast(t('loaded_saved_offline_weather'))
                            } else {
                              showToast(t('no_offline_snapshot'))
                            }
                          } catch {
                            showToast(t('failed_load_offline'))
                          }
                        }}
                      >
                        <Text style={[styles.offlineBtnTextFilled]}>{t('use_offline')}</Text>
                      </TouchableOpacity>
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      {(item && item.data && item.data.daily && item.data.daily.time || []).map((day: string, i: number) => (
                        <View key={i} style={styles.forecastItem}>
                          <Text style={{ fontWeight: '600' }}>{new Date(day).toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                          <Text style={{ fontSize: 20, marginTop: 6 }}>{getEmojiForWeather(item.data.daily.weathercode?.[i])}</Text>
                          <Text style={styles.muted}>{Math.round(item.data.daily.temperature_2m_max[i])}° / {Math.round(item.data.daily.temperature_2m_min[i])}°</Text>
                        </View>
                      ))}
                    </View>
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

function getDescriptionForCode(code: number | undefined) {
  if (code == null) return 'Unknown'
  if (code >= 0 && code <= 3) return 'Clear skies'
  if (code >= 45 && code <= 48) return 'Foggy'
  if (code >= 51 && code <= 67) return 'Light precipitation'
  if (code >= 80 && code <= 99) return 'Rainy'
  return 'Partly cloudy'
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
  forecastItem: { alignItems: 'center', padding: 8, backgroundColor: '#f8fafc', borderRadius: 8, flex: 1, marginHorizontal: 4 },
  offlineRow: { flexDirection: 'row', marginTop: 12, width: '100%' },
  offlineBtn: { borderWidth: 1, padding: 10, borderRadius: 8, flex: 1, marginRight: 8, alignItems: 'center' },
  offlineBtnFilled: { padding: 10, borderRadius: 8, flex: 1, marginLeft: 8, alignItems: 'center' },
  offlineBtnText: { fontWeight: '700' },
  offlineBtnTextFilled: { color: '#fff', fontWeight: '700' },
  mutedSmall: { color: '#6b7280', fontSize: 12, marginTop: 6 }
  ,
  offlineBanner: { padding: 10, borderWidth: 1, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 12 },
  offlineBannerText: { fontWeight: '700' },
  offlineBannerAction: { paddingHorizontal: 8, paddingVertical: 6 },
  offlineBannerActionText: { fontWeight: '800' }
  ,
  statusDot: { width: 12, height: 12, borderRadius: 6 }
})

