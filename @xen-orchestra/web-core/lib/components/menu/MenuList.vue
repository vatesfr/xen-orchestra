<!-- v1.0 -->
<template>
  <slot :bindings="triggerBindings" :is-open="isOpen" :open="open" name="trigger" />
  <Teleport :disabled="!hasTrigger" to="body">
    <ul
      v-if="!hasTrigger || isOpen"
      :id="menuId"
      ref="menu"
      :aria-orientation="horizontal ? 'horizontal' : undefined"
      :class="{ horizontal, border: !noBorder }"
      class="menu-list"
      role="menu"
      v-bind="$attrs"
      @pointerenter="parentLevel?.enterSubmenu()"
    >
      <slot />
    </ul>
  </Teleport>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useMenuLevel } from '@core/composables/menu-level.composable.ts'
import { useMenuListNavigation } from '@core/composables/menu-list-navigation.composable.ts'
import { useMenuPopup } from '@core/composables/menu-popup.composable.ts'
import {
  IK_CLOSE_MENU,
  IK_IN_MENU,
  IK_MENU_HORIZONTAL,
  IK_MENU_LEVEL,
  IK_MENU_PLACEMENT_SIDE,
} from '@core/utils/injection-keys.util.ts'
import type { Options } from 'placement.js'
import { computed, inject, nextTick, provide, shallowRef, useId, useTemplateRef, watch } from 'vue'

export type MenuTriggerBindings = {
  'aria-haspopup': 'menu' | 'dialog'
  'aria-expanded': boolean
  'aria-controls'?: string
}

defineOptions({
  inheritAttrs: false,
})

const { horizontal, noBorder, disabled, placement, anchor } = defineProps<{
  horizontal?: boolean
  noBorder?: boolean
  disabled?: boolean
  placement?: Options['placement']
  anchor?: HTMLElement
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const slots = defineSlots<{
  default(): any
  trigger?(props: { isOpen: boolean; open: (event: Event) => void; bindings: MenuTriggerBindings }): any
}>()

const hasTrigger = slots.trigger !== undefined
const menu = useTemplateRef<HTMLElement>('menu')
const menuId = useId()
const triggerElement = shallowRef<HTMLElement>()
const anchorElement = computed(() => anchor ?? triggerElement.value)

const triggerBindings = computed<MenuTriggerBindings>(() => ({
  'aria-haspopup': 'menu',
  'aria-expanded': isOpen.value,
  'aria-controls': isOpen.value ? menuId : undefined,
}))

const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
provide(
  IK_MENU_HORIZONTAL,
  computed(() => horizontal)
)

useDisabled(() => disabled)

const parentPlacementSide = inject(IK_MENU_PLACEMENT_SIDE, undefined)

const defaultPlacement = computed<Options['placement']>(() => {
  if (isParentHorizontal.value) {
    return 'bottom-start'
  }

  return parentPlacementSide?.value === 'left' ? 'left-start' : 'right-start'
})

const parentLevel = inject(IK_MENU_LEVEL, undefined)
const isSubmenu = hasTrigger && parentLevel !== undefined
const level = useMenuLevel({ isPopup: hasTrigger, horizontal: () => horizontal })
provide(IK_MENU_LEVEL, level)

provide(IK_IN_MENU, true)

const { placementSide, close } = useMenuPopup(menu, {
  isOpen,
  anchor: anchorElement,
  placement: () => placement ?? defaultPlacement.value,
  closesOnClickOutside: hasTrigger && parentLevel?.isPopup !== true,
  hasOpenSubmenu: () => level.openedItemId.value !== undefined,
  onClosed: () => level.close(),
})
provide(IK_MENU_PLACEMENT_SIDE, placementSide)

const injectedCloseMenu = inject(IK_CLOSE_MENU, undefined)
const closeMenu = injectedCloseMenu ?? close

if (injectedCloseMenu === undefined) {
  provide(IK_CLOSE_MENU, hasTrigger ? close : level.close)
}

const { focusFirstItem } = useMenuListNavigation({
  target: () => (hasTrigger ? menu.value : undefined),
  isHorizontal: () => horizontal,
  canCloseWithArrowLeft: () => isSubmenu && !isParentHorizontal.value,
  onClose: () => close(true),
  onLeave: () => closeMenu(true),
})

async function open(event: Event) {
  if (isOpen.value) {
    isOpen.value = false
    return
  }

  triggerElement.value = event.currentTarget as HTMLElement
  isOpen.value = true

  await nextTick()
  focusFirstItem()
}

watch(menu, (menuElement, _, onCleanup) => {
  if (menuElement !== null && isSubmenu) {
    onCleanup(parentLevel.registerSubmenu(menuElement))
  }
})

defineExpose({ focusFirstItem })
</script>

<style lang="postcss" scoped>
.menu-list {
  display: inline-flex;
  flex-direction: column;
  cursor: default;
  color: var(--color-neutral-txt-primary);
  border-radius: 0.4rem;
  background-color: var(--color-neutral-background-primary);
  z-index: 1011;
  overflow: auto;

  &.horizontal {
    flex-direction: row;
  }

  &.border {
    border: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
