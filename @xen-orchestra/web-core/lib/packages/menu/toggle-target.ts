import type { MenuToggleTrigger } from '@core/packages/menu'
import { toComputed } from '@core/utils/to-computed.util'
import { autoUpdate, flip, type Placement, shift, useFloating, type UseFloatingReturn } from '@floating-ui/vue'
import { unrefElement } from '@vueuse/core'
import { computed, reactive, ref, type Ref, type UnwrapRef } from 'vue'

export interface MenuToggleTargetConfig {
  placement?: Placement
}

export interface MenuToggleTargetProps {
  ref: (el: any) => void
  style: {
    display: string | undefined
    zIndex: number
  } & UnwrapRef<UseFloatingReturn['floatingStyles']>
  'data-menu-id': string
}

export class MenuToggleTarget {
  element: Ref<HTMLElement | null> = ref(null)

  styles: UseFloatingReturn['floatingStyles']

  constructor(
    public trigger: MenuToggleTrigger,
    public config: MenuToggleTargetConfig
  ) {
    const { floatingStyles } = useFloating(trigger.element, this.element, {
      placement: toComputed(config.placement, 'bottom-start'),
      open: trigger.isOpen,
      whileElementsMounted: autoUpdate,
      middleware: [shift(), flip()],
    })

    this.styles = floatingStyles
  }

  get props(): MenuToggleTargetProps {
    return reactive({
      as: 'button',
      type: 'button',
      ref: (element: HTMLElement | null | undefined) => {
        const newElement = unrefElement(element)

        if (newElement !== this.element.value) {
          this.element.value = newElement ?? null
        }
      },
      style: computed(() => {
        return {
          display: this.trigger.isOpen.value ? undefined : 'none',
          zIndex: 9999,
          ...this.styles.value,
        }
      }),
      'data-menu-id': this.trigger.menu.context.id,
    })
  }
}
