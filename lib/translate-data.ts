/** Maps API / seed English strings to i18n keys (category_* , commodity_* , etc.). */

const CATEGORY_TO_KEY: Record<string, string> = {
  General: 'category_general',
  'Disease Management': 'category_disease',
  'Market Trends': 'category_market',
  'Weather Preparation': 'category_weather',
}

const COMMODITY_TO_KEY: Record<string, string> = {
  Maize: 'commodity_maize',
  Wheat: 'commodity_wheat',
  Teff: 'commodity_teff',
  Beans: 'commodity_beans',
  Barley: 'commodity_barley',
  Sorghum: 'commodity_sorghum',
}

export function translateCategory(en: string | undefined | null, t: (k: string) => string): string {
  if (!en) return t('category_general')
  const key = CATEGORY_TO_KEY[en]
  return key ? t(key) : en
}

/** Stable English value for API when user picks a translated label — picker still stores EN canonical names. */
export function englishCategoryFromKeyOrLabel(_display: string, canonicalEn: string): string {
  return canonicalEn
}

export function translateCommodity(name: string | undefined | null, t: (k: string) => string): string {
  if (!name) return ''
  const trimmed = name.trim()
  const key = COMMODITY_TO_KEY[trimmed]
  return key ? t(key) : name
}

export function translateUnit(unit: string | undefined | null, t: (k: string) => string): string {
  if (!unit) return ''
  const u = unit.trim().toLowerCase()
  if (u === 'per quintal' || u === 'unit') return t('unit_per_quintal')
  return unit
}

export function translateSuggestionReasons(reasons: string[], t: (k: string) => string): string {
  return reasons
    .map((r) => {
      if (r === 'near_you') return t('suggestion_near_you')
      if (r === 'contacts') return t('suggestion_contacts')
      if (r.startsWith('mutual_')) {
        const n = r.replace('mutual_', '')
        return t('suggestion_mutual').replace('{n}', n)
      }
      return r
    })
    .join(' · ')
}

export function translateNotificationContent(
  item: { id?: string | number; title?: string; message?: string; text?: string },
  t: (k: string) => string
): { title: string; message: string } {
  const id = item.id != null ? String(item.id) : ''
  const titleKey = `notif_item_${id}_title`
  const bodyKey = `notif_item_${id}_body`
  const rawTitle = item.title || item.text || ''
  const rawMsg = item.message || item.text || ''
  const tTitle = t(titleKey)
  const tBody = t(bodyKey)
  return {
    title: tTitle !== titleKey ? tTitle : rawTitle,
    message: tBody !== bodyKey ? tBody : rawMsg || rawTitle,
  }
}
