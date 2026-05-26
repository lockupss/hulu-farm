let currentLang = 'en'

/** Keeps fetch URLs in sync with UI language (server may use ?lang= later). */
export function setApiLanguage(lang: string) {
  currentLang = lang || 'en'
}

export function getApiLanguage(): string {
  return currentLang
}
