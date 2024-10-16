import type { ItemOption } from '@core/modules/menu/parse-item-option'
import type { MenuContext } from '@core/modules/menu/use-menu-context'
import type { Placement } from '@floating-ui/vue'

export type MenuTriggerEvent = 'mouseenter' | 'click'

export type ItemEventOption<TItem extends Menu<any>> = ItemOption<TItem, MenuTriggerEvent>

export type ItemPlacementOption<TItem extends Menu<any>> = ItemOption<TItem, Placement>

export type MenuOptions<TItem extends Menu<any>> = {
  parentItem?: Menu<any> | undefined
  event?: ItemEventOption<TItem>
  placement?: ItemPlacementOption<TItem>
}

export type ObjectMenuDefinition = { [K: string]: MenuDefinition }

export type ArrayMenuDefinition = MenuDefinition[]

export type MenuDefinition = string | ObjectMenuDefinition | ArrayMenuDefinition

export type ParseMenuDefinition<TDefinition> = TDefinition extends [infer U, ...infer V]
  ? ParseMenuDefinition<U> & ParseMenuDefinition<V>
  : TDefinition extends { [K: string]: MenuDefinition }
    ? { [SK in keyof TDefinition]: ParseMenuDefinition<TDefinition[SK]> & Menu<any> }
    : TDefinition extends string
      ? { [K in TDefinition]: Menu<any> }
      : Record<string, never>

export type Menu<TDefinition> = {
  $id: string
  $parentId: string | undefined
  $context: MenuContext
  $level: number
  $hasSubmenu: boolean
  $active: boolean
} & ParseMenuDefinition<TDefinition>
