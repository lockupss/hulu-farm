import CommunityHighlight from '@/components/community-highlight'
import CardUI from '@/components/ui/Card'
import GradientCard from '@/components/ui/GradientCard'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card-header'
import { IconSymbol } from '@/components/ui/icon-symbol'
import { Colors, Typography } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useResponsive } from '@/hooks/use-responsive'
import { useAppData } from '@/lib/app-data'
import { useTranslation } from '@/lib/i18n'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function Home() {
  const responsive = useResponsive()
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()
  const { weather, market } = useAppData()

  // helpers to read weather data from either mock server shape or open-meteo shape
  const temp = weather?.data?.current_weather?.temperature ?? weather?.current?.temp ?? weather?.current?.temperature ?? '--'
  const humidity = weather?.data?.current_weather?.relativehumidity ?? weather?.current?.humidity ?? weather?.current?.relativeHumidity ?? '--'
  const place = weather?.place ?? weather?.location ?? t('your_location')

  const maize = (market || []).find((m: any) => /maize/i.test(m.name || ''))
  const maizePrice = maize?.price || (market && market[0] && market[0].price) || '--'
  const statCards = [
    { label: t('temperature'), value: typeof temp === 'number' ? `${Math.round(temp)}°C` : temp, hint: place },
    { label: t('humidity'), value: typeof humidity === 'number' ? `${humidity}%` : humidity, hint: t('optimal_for_growth_label') },
    { label: t('maize_price'), value: maizePrice, hint: t('compared_to_last_week') },
    { label: t('active_farmers'), value: '12.5K', hint: t('on_the_platform') },
  ]

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: responsive.getSpacing('md') }]}
      showsVerticalScrollIndicator={false}>
      
      {/* Header Section */}
      <View style={styles.headerArea}>
        <Text style={[styles.h1, { color: colors.text, ...Typography.h1 }]}>{t('welcome_title')}</Text>
        <Text style={[styles.sub, { color: colors.textMuted, ...Typography.body }]}>{t('welcome_sub')}</Text>
      </View>

      {/* Alert Card */}
      <GradientCard variant="warning" style={styles.alertCard}>
        <View style={styles.alertContent}>
          <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FFFFFF" />
          <View style={styles.alertTextContainer}>
            <Text style={[styles.alertTitle, { color: '#FFFFFF', ...Typography.h4 }]}>{t('heavy_rain_alert')}</Text>
            <Text style={[styles.alertSub, { color: 'rgba(255, 255, 255, 0.9)', ...Typography.bodySmall }]}>
              {t('expected_temp_drop').replace('{deg}', '5')}
            </Text>
          </View>
        </View>
      </GradientCard>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <CardUI key={card.label} style={[styles.statCard, responsive.isSmall && styles.statCardCompact]}>
            <View style={styles.statIcon}>
              <IconSymbol 
                name={index === 0 ? "thermometer" : index === 1 ? "drop.fill" : index === 2 ? "chart.bar.fill" : "person.2.fill"} 
                size={responsive.isSmall ? 18 : 20} 
                color={colors.primary} 
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted, ...Typography.label }]}>{card.label}</Text>
            <Text style={[styles.big, { color: colors.text, ...Typography.h2 }]}>{card.value}</Text>
            <Text style={[styles.muted, { color: colors.textMuted, ...Typography.caption }]}>{card.hint}</Text>
          </CardUI>
        ))}
      </View>

      {/* Feature Cards */}
      <View style={styles.featureGrid}>
        <CardUI variant="info">
          <CardHeader>
            <CardTitle>{t('recent_weather_alerts')}</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={[styles.rowItem, { borderBottomColor: colors.border }]}>
              <View style={styles.rowItemContent}>
                <View style={styles.rowItemIcon}>
                  <IconSymbol name="cloud.rain.fill" size={16} color={colors.warning} />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: colors.text, ...Typography.bodySmall }]}>{t('rainfall_warning')}</Text>
                  <Text style={[styles.muted, { color: colors.textMuted, ...Typography.caption }]}>{t('heavy_rain_alert')}</Text>
                </View>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.warning + '20' }]}>
                <Text style={{ color: colors.warning, ...Typography.caption }}>{t('tag_alert')}</Text>
              </View>
            </View>
            <View style={styles.rowItem}>
              <View style={styles.rowItemContent}>
                <View style={styles.rowItemIcon}>
                  <IconSymbol name="thermometer.snowflake" size={16} color={colors.info} />
                </View>
                <View>
                  <Text style={[styles.itemTitle, { color: colors.text, ...Typography.bodySmall }]}>{t('temp_drop')}</Text>
                  <Text style={[styles.muted, { color: colors.textMuted, ...Typography.caption }]}>{t('expected_temp_drop').replace('{deg}', '5')}</Text>
                </View>
              </View>
              <View style={[styles.tagSecondary, { backgroundColor: colors.info + '20' }]}>
                <Text style={{ color: colors.info, ...Typography.caption }}>{t('tag_info')}</Text>
              </View>
            </View>
          </View>
        </CardUI>

        <CardUI>
          <CardHeader>
            <CardTitle>{t('market_price_updates')}</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={[styles.rowItemBetween, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.text, ...Typography.bodySmall }}>{t('commodity_maize')}</Text>
              <Text style={{ ...Typography.bodySmall, fontWeight: '700', color: colors.text }}>
                2,450 Br <Text style={{ color: colors.success }}>↑5%</Text>
              </Text>
            </View>
            <View style={[styles.rowItemBetween, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.text, ...Typography.bodySmall }}>{t('commodity_wheat')}</Text>
              <Text style={{ ...Typography.bodySmall, fontWeight: '700', color: colors.text }}>
                3,100 Br <Text style={{ color: colors.success }}>↑2%</Text>
              </Text>
            </View>
            <View style={[styles.rowItemBetween, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.text, ...Typography.bodySmall }}>{t('commodity_teff')}</Text>
              <Text style={{ ...Typography.bodySmall, fontWeight: '700', color: colors.text }}>
                5,200 Br <Text style={{ color: colors.danger }}>↓3%</Text>
              </Text>
            </View>
            <View style={styles.rowItemBetween}>
              <Text style={{ color: colors.text, ...Typography.bodySmall }}>{t('commodity_beans')}</Text>
              <Text style={{ ...Typography.bodySmall, fontWeight: '700', color: colors.text }}>
                4,800 Br <Text style={{ color: colors.success }}>↑1%</Text>
              </Text>
            </View>
          </View>
        </CardUI>
      </View>

      {/* Community Card */}
      <CardUI style={styles.communityCard}>
        <CardHeader>
          <CardTitle>{t('community_highlights_title')}</CardTitle>
          <CardDescription>{t('community_highlights_desc')}</CardDescription>
        </CardHeader>
        <CommunityHighlight />
      </CardUI>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerArea: { marginBottom: 24 },
  h1: { marginBottom: 8 },
  sub: { marginTop: 8 },
  
  // Alert Card Styles
  alertCard: { marginBottom: 20 },
  alertContent: { flexDirection: 'row', alignItems: 'center' },
  alertTextContainer: { marginLeft: 12, flex: 1 },
  alertTitle: { marginBottom: 4 },
  alertSub: { lineHeight: 18 },
  
  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 8 },
  statCard: { 
    width: '48%', 
    minWidth: 150,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statCardCompact: { width: '100%', minWidth: 0 },
  statIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(15, 118, 110, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: { marginBottom: 4, textAlign: 'center' },
  big: { marginTop: 4, marginBottom: 4, textAlign: 'center' },
  muted: { textAlign: 'center' },
  
  // Feature Grid
  featureGrid: { paddingTop: 24, rowGap: 16 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  rowItemBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  rowItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowItemIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  itemTitle: { marginBottom: 2 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tagSecondary: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  
  communityCard: { marginTop: 8 }
})
