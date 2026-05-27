// ─────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: hulu-farm-new/app/(tabs)/market.tsx
// ─────────────────────────────────────────────────────────────────────────────

import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { useAppData } from '@/lib/app-data'
import { useTranslation } from '@/lib/i18n'
import { AllPredictions, fetchAllPredictions } from '@/lib/prediction'
import { translateCommodity, translateUnit } from '@/lib/translate-data'
import React from 'react'
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MarketItem {
  name:    string
  price:   number
  change:  number
  unit:    string
  icon?:   string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalizeMarketItem(it: any): MarketItem {
  return {
    name:   it.name ?? '',
    price:  typeof it.price === 'number' ? it.price : Number(String(it.price ?? '0').replace(/[^0-9.-]+/g, '')) || 0,
    // accept changePercent (Django serializer) OR change (seed / legacy)
    change: it.changePercent ?? it.change ?? 0,
    unit:   it.unit ?? 'unit',
    icon:   it.icon ?? undefined,
  }
}

const PRICE_SEED: MarketItem[] = [
  { name: 'Maize',   price: 2450, change:  4.9, unit: 'per quintal', icon: '🌽' },
  { name: 'Wheat',   price: 3100, change:  1.9, unit: 'per quintal', icon: '🌾' },
  { name: 'Teff',    price: 5200, change: -3.0, unit: 'per quintal', icon: '🌿' },
  { name: 'Beans',   price: 4800, change:  1.1, unit: 'per quintal', icon: '🫘' },
  { name: 'Barley',  price: 2100, change: -2.0, unit: 'per quintal', icon: '🌱' },
  { name: 'Sorghum', price: 1950, change:  4.2, unit: 'per quintal', icon: '🌾' },
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function MarketPrices() {
  const { width } = useWindowDimensions()
  const compact = width < 768

  const [prices, setPrices]       = React.useState<MarketItem[]>(PRICE_SEED)
  const [loading, setLoading]     = React.useState(true)
  const [country, setCountry]     = React.useState<string | null>(null)

  // Per-crop predictions from Flask — shape: { Maize: [...], Wheat: [...], ... }
  const [allPreds, setAllPreds]   = React.useState<AllPredictions | null>(null)
  const [predLoading, setPredLoading] = React.useState(true)

  // ── Fetch Flask predictions (all crops in one call) ─────────────────────────
  React.useEffect(() => {
    let mounted = true
    fetchAllPredictions(30)
      .then(data => { if (mounted) setAllPreds(data) })
      .catch(e => console.warn('Prediction fetch failed:', e))
      .finally(() => { if (mounted) setPredLoading(false) })
    return () => { mounted = false }
  }, [])

  // ── Fetch market prices from Django ─────────────────────────────────────────
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      // Detect country via GPS / browser geolocation
      let lat: number | null = null
      let lon: number | null = null
      try {
        const Loc = await import('expo-location')
        const { status } = await Loc.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Loc.getCurrentPositionAsync({ accuracy: Loc.LocationAccuracy.Balanced })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
        }
      } catch {
        try {
          const p = await new Promise<any>((resolve, reject) => {
            if (typeof navigator !== 'undefined' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            } else reject(new Error('no geolocation'))
          })
          lat = p.coords.latitude
          lon = p.coords.longitude
        } catch { /* no GPS available */ }
      }

      // Reverse-geocode to country name
      let resolvedCountry: string | null = null
      if (lat != null && lon != null) {
        try {
          const r = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`
          )
          if (r.ok) {
            const jd = await r.json()
            resolvedCountry = jd?.results?.[0]?.country ?? null
          }
        } catch { /* ignore */ }
      }

      if (mounted) setCountry(resolvedCountry)

      // Hit the Django market endpoint
      const base = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000'
      const q    = resolvedCountry ? `?country=${encodeURIComponent(resolvedCountry)}` : ''
      try {
        const res = await fetch(`${base}/api/v1/market/${q}`)
        if (res.ok) {
          const data = await res.json()
          const list: any[] = Array.isArray(data) ? data : (data.results ?? data.items ?? [])
          if (list.length && mounted) setPrices(list.map(normalizeMarketItem))
        }
      } catch {
        console.warn('Django market fetch failed — using seed data')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // ── If the AppData provider has market data, it wins ────────────────────────
  const { market: providerMarket } = useAppData()
  React.useEffect(() => {
    if (Array.isArray(providerMarket) && providerMarket.length) {
      setPrices(providerMarket.map(normalizeMarketItem))
      setLoading(false)
    }
  }, [providerMarket])

  // ── Derived values ───────────────────────────────────────────────────────────
  const avgChange = (
    prices.reduce((s, p) => s + (Number(p.change) || 0), 0) / (prices.length || 1)
  ).toFixed(1)

  const { t } = useTranslation()

  /**
   * Get the 30-day predicted low / high for a specific crop.
   * Uses allPreds (per-crop from /predict/all) when available,
   * falls back to a simple ±5% / +8% estimate.
   */
  function getPredRange(cropName: string, currentPrice: number): { low: string; high: string } {
    const series = allPreds?.[cropName]
    if (series && series.length > 0) {
      const low  = Math.min(...series.map(p => p.lower))
      const high = Math.max(...series.map(p => p.upper))
      return { low: low.toFixed(0), high: high.toFixed(0) }
    }
    // Static fallback
    return {
      low:  (currentPrice * 0.95).toFixed(0),
      high: (currentPrice * 1.08).toFixed(0),
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h1}>{t('market_price_updates')}</Text>
        <Text style={styles.sub}>{t('real_time_prices')}</Text>
      </View>

      {/* ── Summary cards ── */}
      <View style={[styles.summaryGrid, compact && styles.summaryStack]}>
        <CardUI style={compact ? styles.fullCard : styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t('average_price_change')}</CardTitle>
          </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>{avgChange}%</Text>
            <Text style={styles.smallMuted}>{t('compared_last_week_short')}</Text>
          </View>
        </CardUI>

        <CardUI style={compact ? styles.fullCard : styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t('highest_demand')}</CardTitle>
          </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>{t('commodity_teff')}</Text>
            <Text style={styles.smallMuted}>{t('premium_market_commodity')}</Text>
          </View>
        </CardUI>

        <CardUI style={compact ? styles.fullCard : styles.summaryCard}>
          <CardHeader>
            <CardTitle>{t('best_price')}</CardTitle>
          </CardHeader>
          <View style={{ padding: 12 }}>
            <Text style={styles.largeText}>{t('city_addis_ababa')}</Text>
            <Text style={styles.smallMuted}>{t('terminal_market_label')}</Text>
          </View>
        </CardUI>
      </View>

      {/* ── Price table ── */}
      <CardUI>
        <CardHeader>
          <CardTitle>{t('current_commodity_prices_card')}</CardTitle>
        </CardHeader>
        <View style={{ padding: 12 }}>
          {loading && (
            <Text style={{ marginBottom: 8, color: '#6b7280' }}>
              {country ? `${t('market_loading_for')} ${country}…` : `${t('market_loading')}…`}
            </Text>
          )}
          {!compact && (
            <View style={styles.tableHeader}>
              <Text style={[styles.col, styles.leftCol]}>{t('table_commodity')}</Text>
              <Text style={[styles.col, styles.rightCol]}>{t('table_current_price')}</Text>
              <Text style={[styles.col, styles.rightCol]}>{t('table_change_br')}</Text>
              <Text style={[styles.col, styles.rightCol]}>{t('table_pct_change')}</Text>
            </View>
          )}
          {prices.map((item, i) => (
            <View key={i} style={[styles.tableRow, compact && styles.tableRowCompact]}>
              <View style={[styles.col, styles.leftCol, compact && styles.colCompact]}>
                <Text style={styles.itemName}>
                  {item.icon ? `${item.icon} ` : ''}{translateCommodity(item.name, t)}
                </Text>
                <Text style={styles.itemUnit}>{translateUnit(item.unit, t)}</Text>
              </View>
              <Text style={[styles.col, styles.rightCol, styles.bold, compact && styles.valueCompact]}>
                {item.price.toLocaleString()} Br
              </Text>
              <Text style={[
                styles.col, styles.rightCol,
                Number(item.change) >= 0 ? styles.positive : styles.negative,
                compact && styles.valueCompact,
              ]}>
                {Number(item.change) >= 0 ? '↑' : '↓'} {Math.abs(Number(item.change))}%
              </Text>
              <View style={[styles.col, styles.rightCol, compact && styles.pillCompactWrap]}>
                <Text style={[
                  styles.pill,
                  Number(item.change) >= 0 ? styles.pillPositive : styles.pillNegative,
                ]}>
                  {Number(item.change) >= 0 ? '+' : ''}{Number(item.change).toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </CardUI>

      {/* ── AI Predictions ── */}
      <CardUI style={{ marginTop: 12 }}>
        <CardHeader>
          <CardTitle>{t('ai_prediction_title')}</CardTitle>
          <CardDescription>{t('ai_prediction_sub')}</CardDescription>
        </CardHeader>
        <View style={{ padding: 12 }}>
          {predLoading && (
            <Text style={{ marginBottom: 8, color: '#6b7280' }}>Loading predictions…</Text>
          )}
          {!predLoading && !allPreds && (
            <Text style={{ marginBottom: 8, color: '#f59e0b', fontSize: 12 }}>
              ⚠ Prediction service offline — showing estimated ranges
            </Text>
          )}
          <View style={styles.predGrid}>
            {prices.map((item, i) => {
              const { low, high } = getPredRange(item.name, item.price)
              // Use the per-crop prediction series for a mini sparkline
              const series = allPreds?.[item.name] ?? []
              return (
                <View key={i} style={[styles.predCard, compact && styles.predCardCompact]}>
                  <Text style={{ fontWeight: '600' }}>
                    {item.icon ? `${item.icon} ` : ''}{translateCommodity(item.name, t)}
                  </Text>
                  <Text style={styles.smallMuted}>{t('expected_range_30d')}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                    <View>
                      <Text style={styles.tinyMuted}>{t('label_low')}</Text>
                      <Text style={styles.bold}>{low} Br</Text>
                    </View>
                    {/* Mini sparkline from actual prediction data */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                      {(series.length > 0 ? series.filter((_, idx) => idx % 6 === 0).slice(0, 5) : Array(5).fill(null))
                        .map((p, barIdx) => {
                          const barH = p
                            ? Math.max(4, Math.round(((p.yhat - (p.yhat * 0.97)) / (p.yhat * 0.06)) * 20))
                            : Math.max(6, (i % 3) * 6 + (barIdx % 3) * 4 + 4)
                          const alpha = 0.4 + (barIdx / 5) * 0.4
                          return (
                            <View key={barIdx} style={[styles.bar, {
                              height: barH,
                              backgroundColor: `rgba(16,185,129,${alpha})`,
                            }]} />
                          )
                        })}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.tinyMuted}>{t('label_high')}</Text>
                      <Text style={styles.bold}>{high} Br</Text>
                    </View>
                  </View>
                </View>
              )
            })}
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
  summaryStack: { flexDirection: 'column', gap: 0 },
  summaryCard: { flex: 1 },
  fullCard: { width: '100%' },
  largeText: { fontSize: 20, fontWeight: '700' },
  smallMuted: { color: '#6b7280', marginTop: 4 },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  tableRowCompact: { flexWrap: 'wrap', rowGap: 8, paddingVertical: 14 },
  col: { flex: 1 },
  leftCol: { flex: 2 },
  colCompact: { flexBasis: '100%', marginBottom: 2 },
  rightCol: { textAlign: 'right', alignItems: 'flex-end' as any },
  valueCompact: { flexBasis: '32%', textAlign: 'left' },
  pillCompactWrap: { flexBasis: '32%', alignItems: 'flex-start' as any },
  itemName: { fontWeight: '600' },
  itemUnit: { color: '#6b7280', fontSize: 12 },
  bold: { fontWeight: '700' },
  positive: { color: 'green' },
  negative: { color: 'red' },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, fontSize: 12, fontWeight: '600' },
  pillPositive: { backgroundColor: '#ECFDF5', color: '#065F46' },
  pillNegative: { backgroundColor: '#FEF2F2', color: '#7F1D1D' },
  predGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  predCard: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, width: '30%', minWidth: 140, marginBottom: 12 },
  predCardCompact: { width: '100%', minWidth: 0 },
  tinyMuted: { color: '#6b7280', fontSize: 12 },
  bar: { width: 6, borderRadius: 2, marginHorizontal: 1 },
})