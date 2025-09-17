import { dsObjectsIcons } from '@core/icons/ds-object-icons'
import { faIcons } from '@core/icons/fa-icons.ts'
import { legacyIcons } from '@core/icons/legacy-icons.ts'
import { objectIcons } from '@core/icons/object-icons.ts'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import type { ICON_SYMBOL } from '@core/packages/icon/types.ts'
import { dsStatusIcon } from './ds-status-icon'

export const icons = defineIconPack({
  fa: faIcons,
  legacy: legacyIcons,
  object: objectIcons,
  dsObject: dsObjectsIcons,
  dsStatus: dsStatusIcon,
})

export type IconName = Exclude<keyof typeof icons, typeof ICON_SYMBOL>

export type ObjectIconName = Extract<IconName, `object:${string}:${string}`>

export function icon<TName extends IconName>(name: TName): TName {
  return name
}
