import type { Menu } from '@core/modules/menu/type'
import { onClickOutside } from '@vueuse/core'

export function applyContext(el: HTMLElement, item: Menu<any>) {
  item.$context.startScope('menu-context', () => {
    onClickOutside(el, () => item.$context.deactivateAllItems(), {
      ignore: [`[${item.$context.id}]`],
    })

    el.setAttribute(item.$context.id, '')
  })
}

export function removeContext(el: HTMLElement, item: Menu<any>) {
  item.$context.stopScope('menu-context')
  el.removeAttribute(item.$context.id)
}
