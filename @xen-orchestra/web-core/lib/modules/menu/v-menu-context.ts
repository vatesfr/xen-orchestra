import { applyContext, removeContext } from '@core/modules/menu/context'
import type { Menu } from '@core/modules/menu/type'
import { type Directive } from 'vue'

export const vMenuContext: Directive<HTMLElement, Menu<any>> = {
  mounted(el, { value: item }) {
    applyContext(el, item)
  },
  unmounted(el, { value: item }) {
    removeContext(el, item)
  },
}
