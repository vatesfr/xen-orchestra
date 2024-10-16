import { applyContext, removeContext } from '@core/modules/menu/context'
import { parseItemOption } from '@core/modules/menu/parse-item-option'
import type { Menu, MenuTriggerEvent } from '@core/modules/menu/type'
import { useEventListener } from '@vueuse/core'
import { type Directive } from 'vue'

export const vMenuTrigger: Directive<HTMLElement, Menu<any>> = {
  mounted(el, { value: item }) {
    item.$context.registerTrigger(item.$id, el)

    item.$context.startScope(`v-menu-trigger-${item.$id}`, () => {
      applyContext(el, item)

      useEventListener(el, ['click', 'mouseenter'], event => {
        const expectedEvent = parseItemOption<MenuTriggerEvent>(item.$context.options.event, item, 'click')

        let shouldBeActive = true

        if (event.type === 'click') {
          shouldBeActive = !item.$active
        } else if (!item.$active) {
          shouldBeActive = event.type === expectedEvent
        }

        if (shouldBeActive) {
          item.$context.deactivateSiblingItems(item.$id)
          item.$context.activateItem(item.$id)
        } else {
          item.$context.deactivateItem(item.$id)
        }
      })
    })
  },
  updated(el, { value: item }) {
    item.$context.registerTrigger(item.$id, el)
  },
  unmounted(el, { value: item }) {
    removeContext(el, item)

    item.$context.stopScope(`v-menu-trigger-${item.$id}`)
  },
}
