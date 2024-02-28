import { createContext } from '@core/composables/context.composable'
import type { BaseColor, Color } from '@core/types/color.type'
import { computed } from 'vue'

export const ColorContext = createContext('info' as Color, (color, previousColor) => {
  return {
    name: color,
    baseName: computed(() => color.value.replace('-alt', '') as BaseColor),
    colorContextClass: computed(() =>
      previousColor.value === color.value ? undefined : `color-context-${color.value}`
    ),
  }
})
