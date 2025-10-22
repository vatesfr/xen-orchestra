import { defineIconPack, ICON_SYMBOL } from '@core/packages/icon'
import { dsActionIcons } from './ds-action-icon'
import { dsObjectsIcons } from './ds-object-icon'
import { dsStatusIcons } from './ds-status-icon'
import { dsTableIcons } from './ds-tables-icon'
import { faIcons } from './fa-icons'
import { legacyIcons } from './legacy-icons'
import { objectIcons } from './object-icons'

export const icons = defineIconPack({
  fa: faIcons,
  legacy: legacyIcons,
  object: objectIcons,
  dsObject: dsObjectsIcons,
  dsStatus: dsStatusIcons,
  dsAction: dsActionIcons,
  dsTable: dsTableIcons,
})

export type IconName = Exclude<keyof typeof icons, typeof ICON_SYMBOL>

export type ObjectIconName = Extract<IconName, `object:${string}:${string}`>

export function icon<TName extends IconName>(name: TName): TName {
  return name
}
