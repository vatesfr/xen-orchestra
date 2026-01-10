import { useCookies } from '@vueuse/integrations/useCookies'
import { computed, watch } from 'vue'

export type ThemeId = 'default' | 'nord' | 'solarized' | 'dracula'

export interface ThemeDefinition {
  id: ThemeId
  labelKey: string
  descriptionKey: string
}

export const themes: ThemeDefinition[] = [
  {
    id: 'default',
    labelKey: 'theme-default',
    descriptionKey: 'theme-default-description',
  },
  {
    id: 'nord',
    labelKey: 'theme-nord',
    descriptionKey: 'theme-nord-description',
  },
  {
    id: 'solarized',
    labelKey: 'theme-solarized',
    descriptionKey: 'theme-solarized-description',
  },
  {
    id: 'dracula',
    labelKey: 'theme-dracula',
    descriptionKey: 'theme-dracula-description',
  },
]

const THEME_COOKIE_KEY = 'theme'
const DEFAULT_THEME: ThemeId = 'default'

export function useTheme() {
  const cookies = useCookies([THEME_COOKIE_KEY])

  const currentTheme = computed<ThemeId>({
    get: () => {
      const cookieValue = cookies.get(THEME_COOKIE_KEY) as ThemeId | undefined
      return cookieValue && themes.some(t => t.id === cookieValue) ? cookieValue : DEFAULT_THEME
    },
    set: (value: ThemeId) => {
      cookies.set(THEME_COOKIE_KEY, value)
    },
  })

  const currentThemeDefinition = computed(() => themes.find(t => t.id === currentTheme.value) ?? themes[0])

  const applyTheme = () => {
    const root = document.documentElement
    themes.forEach(theme => {
      root.classList.remove(`theme-${theme.id}`)
    })
    if (currentTheme.value !== DEFAULT_THEME) {
      root.classList.add(`theme-${currentTheme.value}`)
    }
  }

  watch(currentTheme, applyTheme, { immediate: true })

  return {
    currentTheme,
    currentThemeDefinition,
    themes,
    applyTheme,
  }
}
