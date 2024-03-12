import { createContext } from '@core/composables/context.composable'
import type { Color } from '@core/types/color.type'

export const DisabledContext = createContext(false)

export const ColorContext = createContext<Color | undefined>(undefined)
