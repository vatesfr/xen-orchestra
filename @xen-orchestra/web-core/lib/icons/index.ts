import { dsObjectsIcons } from '@core/icons/ds-object-icons'
import { faIcons } from '@core/icons/fa-icons.ts'
import { legacyIcons } from '@core/icons/legacy-icons.ts'
import { objectIcons } from '@core/icons/object-icons.ts'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import type { ICON_SYMBOL } from '@core/packages/icon/types.ts'
import { dsActionIcon } from './ds-action-icon'
import { dsStatusIcon } from './ds-status-icon'

export const icons = defineIconPack({
  fa: faIcons,
  legacy: legacyIcons,
  object: objectIcons,
  dsObject: dsObjectsIcons,
  dsStatus: dsStatusIcon,
  dsAction: dsActionIcon,
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
