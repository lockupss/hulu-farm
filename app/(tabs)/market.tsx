// ─────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: hulu-farm-new/app/(tabs)/market.tsx
// ─────────────────────────────────────────────────────────────────────────────

import CardUI from '@/components/ui/Card'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { getJSON } from '@/lib/api'
import { useAppData } from '@/lib/app-data'
import { useTranslation } from '@/lib/i18n'
import { AllPredictions, fetchAllPredictions, fetchPrediction } from '@/lib/prediction'
import { translateCommodity, translateUnit } from '@/lib/translate-data'
import React from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'

// ── Types ──────────────────────────────────────────────────────────────────────
interface MarketItem {
  name:    string
  price:   number
  change:  number
  unit:    string
  icon?:   string
  market?: string
}

interface PredPoint {
  date: string
  yhat: number
  lower: number
  upper: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalizeMarketItem(it: any): MarketItem {
  return {
    name:   it.name ?? '',
    price:  typeof it.price === 'number' ? it.price : Number(String(it.price ?? '0').replace(/[^0-9.-]+/g, '')) || 0,
    change: it.changePercent ?? it.change ?? 0,
    unit:   it.unit ?? 'unit',
    icon:   it.icon ?? undefined,
    market: it.market ?? '',
  }
}

const PRICE_SEED: MarketItem[] = [
  { name: 'Maize',   price: 2450, change:  4.9, unit: 'per quintal', icon: '🌽', market: 'Addis Ababa' },
  { name: 'Wheat',   price: 3100, change:  1.9, unit: 'per quintal', icon: '🌾', market: 'Addis Ababa' },
  { name: 'Teff',    price: 5200, change: -3.0, unit: 'per quintal', icon: '🌿', market: 'Addis Ababa' },
  { name: 'Beans',   price: 4800, change:  1.1, unit: 'per quintal', icon: '🫘', market: 'Addis Ababa' },
  { name: 'Barley',  price: 2100, change: -2.0, unit: 'per quintal', icon: '🌱', market: 'Addis Ababa' },
  { name: 'Sorghum', price: 1950, change:  4.2, unit: 'per quintal', icon: '🌾', market: 'Addis Ababa' },
]

const FALLBACK_COMMODITIES = ['Maize', 'Wheat', 'Teff', 'Beans', 'Barley', 'Sorghum']
const FALLBACK_MARKETS      = ['Addis Ababa', 'Hawassa', 'Dire Dawa', 'Mekelle', 'Bahir Dar', 'Jimma']

// ── FilterPicker ───────────────────────────────────────────────────────────────
function FilterPicker({
  label, value, options, onSelect, placeholder,
}: {
  label: string
  value: string
  options: string[]
  onSelect: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <View style={fp.wrap}>
        <Text style={fp.label}>{label}</Text>
        <TouchableOpacity style={fp.btn} onPress={() => setOpen(true)} activeOpacity={0.75}>
          <Text style={[fp.btnText, !value && fp.placeholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Text style={fp.chevron}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={fp.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={fp.sheet}>
            <Text style={fp.sheetTitle}>{label}</Text>
            <TouchableOpacity
              style={[fp.option, !value && fp.optionActive]}
              onPress={() => { onSelect(''); setOpen(false) }}
            >
              <Text style={[fp.optionText, !value && fp.optionActiveText]}>All</Text>
            </TouchableOpacity>
            {options.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[fp.option, value === opt && fp.optionActive]}
                onPress={() => { onSelect(opt); setOpen(false) }}
              >
                <Text style={[fp.optionText, value === opt && fp.optionActiveText]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const fp = StyleSheet.create({
  wrap:            { flex: 1 },
  label:           { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  btn:             { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  btnText:         { flex: 1, fontSize: 13, fontWeight: '600', color: '#111827' },
  placeholder:     { color: '#9CA3AF' },
  chevron:         { fontSize: 12, color: '#6b7280' },
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 },
  sheetTitle:      { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 12 },
  option:          { paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  optionActive:    { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10 },
  optionText:      { fontSize: 14, color: '#374151' },
  optionActiveText:{ color: '#1D4ED8', fontWeight: '700' },
})

// ── Component ──────────────────────────────────────────────────────────────────
export default function MarketPrices() {
  const { width } = useWindowDimensions()
  const compact = width < 768

  // Available filter options fetched from /api/v1/market/filters/
  const [availableCommodities, setAvailableCommodities] = React.useState<string[]>(FALLBACK_COMMODITIES)
  const [availableMarkets,     setAvailableMarkets]     = React.useState<string[]>(FALLBACK_MARKETS)

  // Active filters
  const [cropFilter,   setCropFilter]   = React.useState('')
  const [marketFilter, setMarketFilter] = React.useState('')
  const [country,      setCountry]      = React.useState<string | null>(null)

  const [prices,   setPrices]   = React.useState<MarketItem[]>(PRICE_SEED)
  const [loading,  setLoading]  = React.useState(true)

  // Per-crop predictions from Flask
  const [allPreds,    setAllPreds]    = React.useState<AllPredictions | null>(null)
  const [predLoading, setPredLoading] = React.useState(true)

  // ── 1. Fetch filter options once ────────────────────────────────────────────
  React.useEffect(() => {
    getJSON('/api/v1/market/filters/')
      .then((data: any) => {
        if (Array.isArray(data.commodities) && data.commodities.length) setAvailableCommodities(data.commodities)
        if (Array.isArray(data.markets)     && data.markets.length)     setAvailableMarkets(data.markets)
      })
      .catch(() => { /* keep fallbacks */ })
  }, [])

  // ── 2. Fetch prices whenever any filter changes ──────────────────────────────
  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    ;(async () => {
      // Detect country via GPS (only on first load when no filter is active)
      let resolvedCountry = country
      if (resolvedCountry === null) {
        try {
          const Loc = await import('expo-location')
          const { status } = await Loc.requestForegroundPermissionsAsync()
          if (status === 'granted') {
            const pos = await Loc.getCurrentPositionAsync({ accuracy: Loc.LocationAccuracy.Balanced })
            const r = await fetch(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&count=1`
            )
            if (r.ok) {
              const jd = await r.json()
              resolvedCountry = jd?.results?.[0]?.country ?? ''
            }
          }
        } catch { resolvedCountry = '' }
        if (mounted) setCountry(resolvedCountry ?? '')
      }

      const base = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000'
      const params = new URLSearchParams()
      if (resolvedCountry) params.set('country',   resolvedCountry)
      if (cropFilter)      params.set('commodity', cropFilter)
      if (marketFilter)    params.set('market',    marketFilter)
      const q = params.toString() ? `?${params.toString()}` : ''

      try {
        const res = await fetch(`${base}/api/v1/market/${q}`)
        if (res.ok) {
          const data = await res.json()
          const list: any[] = Array.isArray(data) ? data : (data.results ?? data.items ?? [])
          if (list.length && mounted) setPrices(list.map(normalizeMarketItem))
        }
      } catch {
        console.warn('Market fetch failed — using seed data')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [cropFilter, marketFilter]) // re-fetch whenever filters change

  // ── 3. Fetch Flask predictions, scoped to crop filter ───────────────────────
  React.useEffect(() => {
    let mounted = true
    setPredLoading(true)
    if (cropFilter) {
      // Fetch prediction for the single selected crop
      fetchPrediction(30, cropFilter)
        .then(series => {
          if (mounted) setAllPreds(series ? { [cropFilter]: series } : null)
        })
        .catch(() => { if (mounted) setAllPreds(null) })
        .finally(() => { if (mounted) setPredLoading(false) })
    } else {
      // Fetch predictions for all crops
      fetchAllPredictions(30)
        .then(data => { if (mounted) setAllPreds(data) })
        .catch(() => { if (mounted) setAllPreds(null) })
        .finally(() => { if (mounted) setPredLoading(false) })
    }
    return () => { mounted = false }
  }, [cropFilter])

  // ── AppData provider override ────────────────────────────────────────────────
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

  function getPredRange(cropName: string, currentPrice: number): { low: string; high: string } {
    const series = allPreds?.[cropName]
    if (series && series.length > 0) {
      const low  = Math.min(...series.map((p: PredPoint) => p.lower))
      const high = Math.max(...series.map((p: PredPoint) => p.upper))
      return { low: low.toFixed(0), high: high.toFixed(0) }
    }
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

      {/* ── Filter bar ── */}
      <CardUI style={{ marginBottom: 12 }}>
        <View style={{ padding: 12 }}>
          <Text style={styles.filterHeading}>Filter prices</Text>
          <View style={styles.filterRow}>
            <FilterPicker
              label="Crop"
              value={cropFilter}
              options={availableCommodities}
              onSelect={setCropFilter}
              placeholder="All crops"
            />
            <View style={{ width: 10 }} />
            <FilterPicker
              label="Market"
              value={marketFilter}
              options={availableMarkets}
              onSelect={setMarketFilter}
              placeholder="All markets"
            />
          </View>
          {(cropFilter || marketFilter) && (
            <TouchableOpacity
              onPress={() => { setCropFilter(''); setMarketFilter('') }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕  Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </CardUI>

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
            <Text style={styles.largeText}>{marketFilter || t('city_addis_ababa')}</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={{ color: '#6b7280' }}>
                {cropFilter || marketFilter ? 'Filtering…' : country ? `Loading for ${country}…` : 'Loading…'}
              </Text>
            </View>
          )}
          {!loading && prices.length === 0 && (
            <Text style={{ color: '#6b7280', textAlign: 'center', paddingVertical: 16 }}>
              No prices found for the selected filters.
            </Text>
          )}
          {!compact && prices.length > 0 && (
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
                {item.market ? <Text style={styles.itemMarket}>📍 {item.market}</Text> : null}
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
          <CardDescription>
            {cropFilter
              ? `30-day forecast · ${cropFilter}${marketFilter ? ` · ${marketFilter}` : ''}`
              : t('ai_prediction_sub')}
          </CardDescription>
        </CardHeader>
        <View style={{ padding: 12 }}>
          {predLoading && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={{ color: '#6b7280' }}>Loading predictions…</Text>
            </View>
          )}
          {!predLoading && !allPreds && (
            <Text style={{ marginBottom: 8, color: '#f59e0b', fontSize: 12 }}>
              ⚠ Prediction service offline — showing estimated ranges
            </Text>
          )}
          <View style={styles.predGrid}>
            {prices.map((item, i) => {
              const { low, high } = getPredRange(item.name, item.price)
              const series = (allPreds?.[item.name] ?? []) as PredPoint[]
              return (
                <View key={i} style={[styles.predCard, compact && styles.predCardCompact]}>
                  <Text style={{ fontWeight: '600' }}>
                    {item.icon ? `${item.icon} ` : ''}{translateCommodity(item.name, t)}
                  </Text>
                  {item.market ? <Text style={styles.predMarket}>📍 {item.market}</Text> : null}
                  <Text style={styles.smallMuted}>{t('expected_range_30d')}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                    <View>
                      <Text style={styles.tinyMuted}>{t('label_low')}</Text>
                      <Text style={styles.bold}>{low} Br</Text>
                    </View>
                    {/* Mini sparkline */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                      {(series.length > 0
                        ? series.filter((_, idx) => idx % 6 === 0).slice(0, 5)
                        : Array(5).fill(null)
                      ).map((p, barIdx) => {
                        const barH = p
                          ? Math.max(4, Math.round(((p.yhat - p.yhat * 0.97) / (p.yhat * 0.06)) * 20))
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
  h1:               { fontSize: 24, fontWeight: '700' },
  sub:              { color: '#6b7280', marginTop: 6 },
  filterHeading:    { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  filterRow:        { flexDirection: 'row', alignItems: 'flex-end' },
  clearBtn:         { marginTop: 10, alignSelf: 'flex-start' },
  clearBtnText:     { fontSize: 12, color: '#EF4444', fontWeight: '700' },
  summaryGrid:      { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  summaryStack:     { flexDirection: 'column', gap: 0 },
  summaryCard:      { flex: 1 },
  fullCard:         { width: '100%' },
  largeText:        { fontSize: 20, fontWeight: '700' },
  smallMuted:       { color: '#6b7280', marginTop: 4 },
  tableHeader:      { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  tableRow:         { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  tableRowCompact:  { flexWrap: 'wrap', rowGap: 8, paddingVertical: 14 },
  col:              { flex: 1 },
  leftCol:          { flex: 2 },
  colCompact:       { flexBasis: '100%', marginBottom: 2 },
  rightCol:         { textAlign: 'right', alignItems: 'flex-end' as any },
  valueCompact:     { flexBasis: '32%', textAlign: 'left' },
  pillCompactWrap:  { flexBasis: '32%', alignItems: 'flex-start' as any },
  itemName:         { fontWeight: '600' },
  itemUnit:         { color: '#6b7280', fontSize: 12 },
  itemMarket:       { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  bold:             { fontWeight: '700' },
  positive:         { color: 'green' },
  negative:         { color: 'red' },
  pill:             { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, fontSize: 12, fontWeight: '600' },
  pillPositive:     { backgroundColor: '#ECFDF5', color: '#065F46' },
  pillNegative:     { backgroundColor: '#FEF2F2', color: '#7F1D1D' },
  predGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  predCard:         { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, width: '30%', minWidth: 140, marginBottom: 12 },
  predCardCompact:  { width: '100%', minWidth: 0 },
  predMarket:       { fontSize: 10, color: '#9CA3AF', marginBottom: 2 },
  tinyMuted:        { color: '#6b7280', fontSize: 12 },
  bar:              { width: 6, borderRadius: 2, marginHorizontal: 1 },
})
