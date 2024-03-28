import { createContext } from '@core/composables/context.composable'
import type { Color } from '@core/types/color.type'
import { computed } from 'vue'

export const DisabledContext = createContext(false)

export const ColorContext = createContext('info' as Color, (color, previousColor) => ({
  name: color,
  colorContextClass: computed(() => (previousColor.value === color.value ? undefined : `color-context-${color.value}`)),
}))
