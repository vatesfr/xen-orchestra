import type { Menu, MenuDefinition, MenuOptions } from '@core/modules/menu/type'
import { useMenuContext } from '@core/modules/menu/use-menu-context'
import { uniqueId } from '@core/utils/unique-id.util'
import { computed, reactive } from 'vue'

export { vMenuTrigger } from '@core/modules/menu/v-menu-trigger'

export { vMenuTarget } from '@core/modules/menu/v-menu-target'

export { vMenuContext } from '@core/modules/menu/v-menu-context'

export type { Menu }

export function useMenu<TDefinition extends MenuDefinition, TMenu extends Menu<TDefinition> = Menu<TDefinition>>(
  parentItem?: Menu<any>,
  optionsOverride: MenuOptions<TMenu> = {}
): TMenu {
  const id = uniqueId('menu-item')
  const parentId = parentItem?.$id
  const context = parentItem?.$context ?? useMenuContext(optionsOverride)
  const level = parentItem?.$level !== undefined ? parentItem.$level + 1 : 0

  const item = reactive({
    $id: id,
    $parentId: parentId,
    $context: context,
    $level: level,
    $hasSubmenu: computed(() => context.hasItemChildren(id)),
    $active: computed(() => context.isItemActive(id)),
  }) as TMenu

  context.registerItem(item)

  const subMenus = new Map()

  return new Proxy(item, {
    get(target, subMenuKey, receiver) {
      if (subMenuKey in target) {
        return Reflect.get(target, subMenuKey, receiver)
      }

      if (!subMenus.has(subMenuKey)) {
        subMenus.set(subMenuKey, useMenu(item))
      }

      return subMenus.get(subMenuKey)
    },
  })
}
