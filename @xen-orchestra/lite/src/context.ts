import { createContext } from '@/composables/context.composable'
import type { Color } from '@/types'
import { computed } from 'vue'

export const ColorContext = createContext('info' as Color, color => ({
  name: color,
  textClass: computed(() => `context-color-${color.value}`),
  backgroundClass: computed(() => `context-background-color-${color.value}`),
  borderClass: computed(() => `context-border-color-${color.value}`),
}))
