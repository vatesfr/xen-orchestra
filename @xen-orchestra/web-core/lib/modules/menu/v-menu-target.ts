import { applyContext, removeContext } from '@core/modules/menu/context'
import { parseItemOption } from '@core/modules/menu/parse-item-option'
import type { Menu } from '@core/modules/menu/type'
import { flip, type Placement, shift, useFloating } from '@floating-ui/vue'
import { computed, type Directive, ref, watchEffect } from 'vue'

export const vMenuTarget: Directive<HTMLElement, Menu<any>> = {
  mounted(el, { value: item }) {
    item.$context.startScope(`v-menu-target-${item.$id}`, () => {
      applyContext(el, item)

      const trigger = computed(() => item.$context.getTrigger(item.$id))
      const target = ref(el)
      const isActive = computed(() => item.$active)
      const placement = parseItemOption<Placement>(item.$context.options.placement, item, 'bottom-start')

      const { floatingStyles } = useFloating(trigger, target, {
        placement,
        open: isActive,
        middleware: [shift(), flip()],
      })

      watchEffect(() => (el.style.display = isActive.value ? '' : 'none'))

      watchEffect(() => Object.assign(el.style, floatingStyles.value))
    })
  },
  unmounted(el, { value: item }) {
    removeContext(el, item)
    item.$context.stopScope(`v-menu-target-${item.$id}`)
  },
}
