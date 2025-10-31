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

export type ObjectStateByType = {
  [TName in IconName as TName extends `object:${infer TType}:${string}`
    ? TType
    : never]: TName extends `object:${string}:${infer TType}` ? TType : never
}

export type ObjectType = keyof ObjectStateByType

export type ObjectState<TType extends ObjectType> = ObjectStateByType[TType]

export function objectIcon<TType extends ObjectType, TState extends ObjectState<TType>>(
  type: TType,
  state: TState
): IconName {
  return `object:${type}:${state}` as IconName
}
