import { BaseItem, Menu } from '@core/packages/menu'
import { unrefElement, whenever } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter, reactive, ref, type Ref, toValue } from 'vue'

export interface MenuToggleTriggerConfig {
  behavior?: MaybeRefOrGetter<'click' | 'mouseenter'>
}

export interface MenuToggleTriggerProps {
  ref: (el: any) => void
  as: 'button'
  type: 'button'
  submenu: true
  onClick: () => void
  onMouseenter: () => void
  selected: boolean
  'data-menu-id': string
}

export class MenuToggleTrigger extends BaseItem {
  element: Ref<HTMLElement | null> = ref(null)

  subMenu: Menu

  isSelfOpen = ref(false)

  isOpen = computed(() => this.isSelfOpen.value || this.subMenu.isActive.value)

  constructor(
    public menu: Menu,
    public config: MenuToggleTriggerConfig
  ) {
    super(menu)
    this.subMenu = new Menu(menu.context)

    whenever(
      () => !this.isActive.value && !this.subMenu.isActive.value,
      () => {
        this.isSelfOpen.value = false
      }
    )
  }

  get isActive(): ComputedRef<boolean> {
    return computed(() => super.isActive.value || this.subMenu?.isActive.value)
  }

  get props(): MenuToggleTriggerProps {
    return reactive({
      ref: (element: HTMLElement | null | undefined) => {
        const newElement = unrefElement(element)

        if (newElement !== this.element.value) {
          this.element.value = newElement ?? null
        }
      },
      as: 'button',
      type: 'button',
      submenu: true,
      onClick: () => (this.isSelfOpen.value = !this.isOpen.value),
      onMouseenter: () => {
        this.activate()

        if (toValue(this.config.behavior) === 'mouseenter') {
          this.isSelfOpen.value = true
        }
      },
      selected: computed(() => this.isOpen.value),
      'data-menu-id': this.menu.context.id,
    })
  }
}
