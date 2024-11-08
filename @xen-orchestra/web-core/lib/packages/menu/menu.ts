import {
  MenuAction,
  MenuContext,
  MenuLink,
  MenuRouterLink,
  type MenuStructure,
  MenuToggleTrigger,
  type ParseStructure,
  parseStructure,
} from '@core/packages/menu'
import { extendRef } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter, shallowReactive, type ShallowReactive } from 'vue'

export const MENU_SYMBOL = Symbol('Submenu')

export type WithMenu = { [MENU_SYMBOL]: Menu }

export type MenuLike = Menu | WithMenu

type MenuItem = MenuAction | MenuLink | MenuRouterLink | MenuToggleTrigger

export class Menu {
  items: ShallowReactive<Map<symbol, MenuItem>> = shallowReactive(new Map())

  isActive = computed(() => Array.from(this.items.values()).some(item => item.isActive.value))

  constructor(public context: MenuContext) {}

  addItem(item: MenuItem) {
    this.items.set(item.id, item)
  }
}

export function useMenu<const TStructure extends MenuStructure>(
  structure: MaybeRefOrGetter<TStructure>
): ComputedRef<ParseStructure<TStructure> & WithMenu> & WithMenu {
  const context = new MenuContext()

  const menu = new Menu(context)

  return extendRef(
    computed(() => {
      return {
        ...parseStructure(menu, structure),
        [MENU_SYMBOL]: menu,
      }
    }),
    { [MENU_SYMBOL]: menu }
  )
}
