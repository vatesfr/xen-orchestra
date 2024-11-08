import type { MenuAction, MenuLink, MenuRouterLink, MenuToggleTrigger, Menu } from '@core/packages/menu'
import { computed } from 'vue'

export type MenuItem = MenuAction | MenuLink | MenuRouterLink | MenuToggleTrigger

export abstract class BaseItem {
  id = Symbol('Menu Item')

  protected constructor(public menu: Menu) {
    menu.addItem(this as any)
  }

  get isActive() {
    return computed(() => this.menu.context.activeItemId.value === this.id)
  }

  activate() {
    this.menu.context.activeItemId.value = this.id
  }

  deactivate() {
    if (this.isActive.value) {
      this.menu.context.activeItemId.value = undefined
    }
  }
}
