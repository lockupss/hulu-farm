import CommunityHighlight from '@/components/community-highlight'
import CardUI from '@/components/ui/Card'
import { CardHeader, CardTitle } from '@/components/ui/card-header'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useTranslation } from '@/lib/i18n'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function Home() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']
  const { t } = useTranslation()

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerArea}>
  <Text style={[styles.h1, { color: colors.text }]}>{t('welcome_title')}</Text>
  <Text style={styles.sub}>{t('welcome_sub')}</Text>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertText}>{t('heavy_rain_alert')}</Text>
      </View>

      <View style={styles.statsGrid}>
  <CardUI>
          <CardHeader>
            <CardTitle>{t('temperature')}</CardTitle>
          </CardHeader>
          <Text style={styles.big}>28°C</Text>
    <Text style={styles.muted}>{t('partly_cloudy_label')}</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>{t('humidity')}</CardTitle>
          </CardHeader>
          <Text style={styles.big}>65%</Text>
    <Text style={styles.muted}>{t('optimal_for_growth_label')}</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>{t('maize_price')}</CardTitle>
          </CardHeader>
          <Text style={styles.big}>2,450 Br</Text>
    <Text style={styles.muted}>{t('compared_to_last_week')}</Text>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>{t('active_farmers')}</CardTitle>
          </CardHeader>
          <Text style={styles.big}>12.5K</Text>
    <Text style={styles.muted}>{t('on_the_platform')}</Text>
  </CardUI>
      </View>

      <View style={styles.featureGrid}>
  <CardUI>
          <CardHeader>
            <CardTitle>{t('recent_weather_alerts')}</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={styles.rowItem}>
              <View>
                <Text style={styles.itemTitle}>{t('rainfall_warning')}</Text>
                <Text style={styles.muted}>{t('heavy_rain_alert')}</Text>
              </View>
              <View style={styles.tag}><Text style={{ color: '#0366d6' }}>Alert</Text></View>
            </View>
            <View style={styles.rowItem}>
              <View>
                <Text style={styles.itemTitle}>{t('temp_drop')}</Text>
                <Text style={styles.muted}>{t('expected_temp_drop').replace('{deg}', '5')}</Text>
              </View>
              <View style={styles.tagSecondary}><Text style={{ color: '#6b7280' }}>Info</Text></View>
            </View>
          </View>
  </CardUI>

  <CardUI>
          <CardHeader>
            <CardTitle>{t('market_price_updates')}</CardTitle>
          </CardHeader>
          <View style={{ paddingTop: 6 }}>
            <View style={styles.rowItemBetween}><Text>{t('commodity_maize')}</Text><Text style={{ fontWeight: '700' }}>2,450 Br <Text style={{ color: 'green' }}>↑5%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>{t('commodity_wheat')}</Text><Text style={{ fontWeight: '700' }}>3,100 Br <Text style={{ color: 'green' }}>↑2%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>{t('commodity_teff')}</Text><Text style={{ fontWeight: '700' }}>5,200 Br <Text style={{ color: 'red' }}>↓3%</Text></Text></View>
            <View style={styles.rowItemBetween}><Text>{t('commodity_beans')}</Text><Text style={{ fontWeight: '700' }}>4,800 Br <Text style={{ color: 'green' }}>↑1%</Text></Text></View>
          </View>
  </CardUI>
      </View>
      {/* Community highlight inserted below */}
      <CardUI style={{ margin: 16 }}>
        <CommunityHighlight />
      </CardUI>
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
