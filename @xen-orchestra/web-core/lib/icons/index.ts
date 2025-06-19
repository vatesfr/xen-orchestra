import { faIcons } from '@core/icons/fa-icons.ts'
import { legacyIcons } from '@core/icons/legacy-icons.ts'
import { objectIcons } from '@core/icons/object-icons.ts'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import type { ICON_SYMBOL } from '@core/packages/icon/types.ts'

export const icons = defineIconPack({
  fa: faIcons,
  legacy: legacyIcons,
  object: objectIcons,
})

export type IconName = Exclude<keyof typeof icons, typeof ICON_SYMBOL>

export type ObjectIconName = Extract<IconName, `object:${string}`>
