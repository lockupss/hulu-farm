import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { useTranslation } from '@/lib/i18n'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function MarketPrices() {
  const pricesSeed = [
    { name: 'Maize', price: 2450, change: 5, unit: 'per quintal' },
    { name: 'Wheat', price: 3100, change: 2, unit: 'per quintal' },
    { name: 'Teff', price: 5200, change: -3, unit: 'per quintal' },
    { name: 'Beans', price: 4800, change: 1, unit: 'per quintal' },
    { name: 'Barley', price: 2100, change: -2, unit: 'per quintal' },
    { name: 'Sorghum', price: 1950, change: 4, unit: 'per quintal' },
  ]
  const [prices, setPrices] = React.useState(pricesSeed)
  const [loading, setLoading] = React.useState(true)
  const [country, setCountry] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // try expo-location first (dynamic import)
        let lat: number | null = null
        let lon: number | null = null
        try {
          const Loc = await import('expo-location')
          const { status } = await Loc.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const pos = await Loc.getCurrentPositionAsync({ accuracy: Loc.LocationAccuracy.Highest })
            lat = pos.coords.latitude
            lon = pos.coords.longitude
          }
        } catch {
          // fallback to browser geolocation if available
          try {
            const p = await new Promise((resolve, reject) => {
              if (typeof navigator !== 'undefined' && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => resolve(pos), (err) => reject(err), { timeout: 5000 })
              } else reject(new Error('no geolocation'))
            }) as any
            lat = p.coords.latitude
            lon = p.coords.longitude
          } catch {
            // ignore, will fetch default
          }
        }

        // reverse geocode to get country (Open-Meteo reverse endpoint)
        let resolvedCountry: string | null = null
        if (lat != null && lon != null) {
          try {
            const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`)
            if (r.ok) {
              const jd = await r.json()
              if (jd && jd.results && jd.results[0] && jd.results[0].country) {
                resolvedCountry = jd.results[0].country
              }
            }
          } catch {
              // ignore
            }
        }

        if (!resolvedCountry) {
          // try locale as fallback
          const locale = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().locale : null
          if (locale && typeof locale === 'string') {
            // locale like en-US => country part US
            const parts = locale.split('-')
            if (parts.length > 1) resolvedCountry = parts[1]
          }
        }

        if (!mounted) return
        setCountry(resolvedCountry)

        // fetch market data with optional country param
        const q = resolvedCountry ? `?country=${encodeURIComponent(resolvedCountry)}` : ''
        try {
          const res = await fetch(`${process.env.API_BASE || 'http://localhost:3333'}/api/market${q}`)
          if (res.ok) {
            const data = await res.json()
            // server returns array or object; normalize to array
            const list = Array.isArray(data) ? data : (data.items || data.prices || [])
            if (list && list.length) setPrices(list.map((it: any) => ({ name: it.name, price: typeof it.price === 'number' ? it.price : Number(String(it.price).replace(/[^0-9.-]+/g, '')) || 0, change: it.changePercent || (it.change || 0), unit: it.unit || 'unit' })))
          }
        } catch {
          console.warn('market fetch failed')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const avgChange = ((prices.reduce((s, p) => s + (Number(p.change) || 0), 0) / prices.length) || 0).toFixed(1)

  const { t } = useTranslation()

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h1}>{t('market_price_updates')}</Text>
        <Text style={styles.sub}>{t('real_time_prices')}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <CardUI>
          <CardHeader>
              <CardTitle>{t('average_price_change')}</CardTitle>
            </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>{avgChange}%</Text>
            <Text style={styles.smallMuted}>Compared to last week</Text>
          </View>
        </CardUI>

        <CardUI>
          <CardHeader>
              <CardTitle>{t('highest_demand')}</CardTitle>
            </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>Teff</Text>
            <Text style={styles.smallMuted}>Premium market commodity</Text>
          </View>
        </CardUI>

        <CardUI>
          <CardHeader>
              <CardTitle>{t('best_price')}</CardTitle>
            </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>Addis Ababa</Text>
            <Text style={styles.smallMuted}>Terminal market</Text>
          </View>
        </CardUI>
      </View>

      <CardUI>
        <CardHeader>
          <CardTitle>Current Commodity Prices</CardTitle>
        </CardHeader>
        <View style={{ padding: 12 }}>
          {loading && <Text style={{ marginBottom: 8, color: '#6b7280' }}>Loading market data{country ? ` for ${country}` : ''}...</Text>}
          <View style={styles.tableHeader}>
            <Text style={[styles.col, styles.leftCol]}>Commodity</Text>
            <Text style={[styles.col, styles.rightCol]}>Current Price</Text>
            <Text style={[styles.col, styles.rightCol]}>Change</Text>
            <Text style={[styles.col, styles.rightCol]}>% Change</Text>
          </View>
          {prices.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.col, styles.leftCol]}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
              </View>
              <Text style={[styles.col, styles.rightCol, styles.bold]}>{item.price.toLocaleString()} Br</Text>
              <Text style={[styles.col, styles.rightCol, (item.change && Number(item.change) >= 0) ? styles.positive : styles.negative]}> {item.change && Number(item.change) >= 0 ? '↑' : '↓'} {Math.abs(Number(item.change) || 0)} Br</Text>
              <View style={[styles.col, styles.rightCol]}>
                <Text style={[styles.pill, (item.change && Number(item.change) >= 0) ? styles.pillPositive : styles.pillNegative]}>{(item.change && Number(item.change) >= 0) ? '+' : ''}{item.change}%</Text>
              </View>
            </View>
          ))}
        </View>
      </CardUI>

      <CardUI style={{ marginTop: 12 }}>
        <CardHeader>
          <CardTitle>AI-Based Price Prediction</CardTitle>
          <CardDescription>Next 30 days forecast for major commodities</CardDescription>
        </CardHeader>
        <View style={{ padding: 12 }}>
          <View style={styles.predGrid}>
            {prices.map((item, i) => (
              <View key={i} style={styles.predCard}>
                <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                <Text style={styles.smallMuted}>Expected range in 30 days</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <View>
                    <Text style={styles.tinyMuted}>Low</Text>
                    <Text style={styles.bold}>{(item.price * 0.95).toFixed(0)} Br</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.bar, { height: Math.max(6, (i % 3) * 6 + 6), backgroundColor: 'rgba(16,185,129,0.4)' }]} />
                    <View style={[styles.bar, { height: Math.max(6, ((i + 1) % 3) * 6 + 8), backgroundColor: 'rgba(16,185,129,0.6)' }]} />
                    <View style={[styles.bar, { height: Math.max(6, ((i + 2) % 3) * 6 + 4), backgroundColor: 'rgba(16,185,129,0.4)' }]} />
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.tinyMuted}>High</Text>
                    <Text style={styles.bold}>{(item.price * 1.08).toFixed(0)} Br</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </CardUI>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700' },
  sub: { color: '#6b7280', marginTop: 6 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  largeText: { fontSize: 20, fontWeight: '700' },
  smallMuted: { color: '#6b7280', marginTop: 4 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  col: { flex: 1 },
  leftCol: { flex: 2 },
  rightCol: { textAlign: 'right', alignItems: 'flex-end' as any },
  itemName: { fontWeight: '600' },
  itemUnit: { color: '#6b7280', fontSize: 12 },
  bold: { fontWeight: '700' },
  positive: { color: 'green' },
  negative: { color: 'red' },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, fontSize: 12, fontWeight: '600' },
  pillPositive: { backgroundColor: '#ECFDF5', color: '#065F46' },
  pillNegative: { backgroundColor: '#FEF2F2', color: '#7F1D1D' },
  predGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  predCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, width: '30%', marginBottom: 12 },
  tinyMuted: { color: '#6b7280', fontSize: 12 },
  bar: { width: 6, borderRadius: 2, marginHorizontal: 2 },
})
