import { useCookies } from '@vueuse/integrations/useCookies'
import { computed, watch } from 'vue'

export type ThemeId = 'default' | 'nord' | 'solarized' | 'dracula' | 'monokai'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
}

export const themes: ThemeDefinition[] = [
  {
    id: 'default',
    label: 'theme-default',
    description: 'theme-default-description',
  },
  {
    id: 'nord',
    label: 'theme-nord',
    description: 'theme-nord-description',
  },
  {
    id: 'solarized',
    label: 'theme-solarized',
    description: 'theme-solarized-description',
  },
  {
    id: 'dracula',
    label: 'theme-dracula',
    description: 'theme-dracula-description',
  },
  {
    id: 'monokai',
    label: 'theme-monokai',
    description: 'theme-monokai-description',
  },
]

const THEME_COOKIE_KEY = 'theme'
const DEFAULT_THEME: ThemeId = 'default'

export function useTheme() {
  const cookies = useCookies([THEME_COOKIE_KEY])

  const currentTheme = computed<ThemeId>({
    get: () => {
      const cookieValue = cookies.get(THEME_COOKIE_KEY) as ThemeId | undefined
      return themes.find(theme => theme.id === cookieValue)?.id ?? DEFAULT_THEME
    },
    set: (value: ThemeId) => {
      cookies.set(THEME_COOKIE_KEY, value)
    },
  })

  const currentThemeDefinition = computed(() => themes.find(theme => theme.id === currentTheme.value) ?? themes[0])

  const applyTheme = () => {
    const root = document.documentElement

    themes.forEach(theme => {
      if (theme.id !== 'default') {
        root.classList.remove(`theme-${theme.id}`)
      }
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
