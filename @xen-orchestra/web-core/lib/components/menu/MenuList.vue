<!-- v1.0 -->
<template>
  <slot :is-open="isOpen" :open="open" name="trigger" />
  <Teleport :disabled="!hasTrigger" to="body">
    <ul
      v-if="!hasTrigger || isOpen"
      ref="menu"
      :class="{ horizontal, border: !noBorder }"
      class="menu-list"
      v-bind="$attrs"
    >
      <slot />
    </ul>
  </Teleport>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useMenuListNavigation } from '@core/composables/menu-list-navigation.composable.ts'
import {
  IK_CLOSE_MENU,
  IK_IN_MENU,
  IK_MENU_HORIZONTAL,
  IK_MENU_PLACEMENT_SIDE,
} from '@core/utils/injection-keys.util.ts'
import { placeOverlay } from '@core/utils/placement.util.ts'
import { onClickOutside, unrefElement, whenever } from '@vueuse/core'
import type { Options } from 'placement.js'
import { computed, inject, nextTick, provide, ref, useSlots } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  horizontal?: boolean
  noBorder?: boolean
  disabled?: boolean
  placement?: Options['placement']
}>()

const slots = useSlots()
const isOpen = ref(false)
const menu = ref()
const isParentHorizontal = inject(
  IK_MENU_HORIZONTAL,
  computed(() => false)
)
provide(
  IK_MENU_HORIZONTAL,
  computed(() => props.horizontal ?? false)
)

useDisabled(() => props.disabled)

const parentPlacementSide = inject(IK_MENU_PLACEMENT_SIDE, undefined)
const placementSide = ref<string>()
provide(IK_MENU_PLACEMENT_SIDE, placementSide)

const defaultPlacement = computed<Options['placement']>(() => {
  if (isParentHorizontal.value) {
    return 'bottom-start'
  }

  return parentPlacementSide?.value === 'left' ? 'left-start' : 'right-start'
})

let clearClickOutsideEvent: (() => void) | undefined

const hasTrigger = useSlots().trigger !== undefined

const isSubmenu = inject(IK_IN_MENU, false)

provide(IK_IN_MENU, true)

whenever(
  () => !isOpen.value,
  () => clearClickOutsideEvent?.()
)

const closeParentMenu = inject(IK_CLOSE_MENU, undefined)

if (slots.trigger && closeParentMenu === undefined) {
  provide(IK_CLOSE_MENU, close)
}

const closeMenuChain = closeParentMenu ?? close

const { focusFirstItem } = useMenuListNavigation({
  target: () => (hasTrigger ? menu.value : undefined),
  isHorizontal: () => props.horizontal ?? false,
  canCloseWithArrowLeft: () => isSubmenu && !isParentHorizontal.value,
  onClose: close,
  onLeave: closeMenuChain,
})

let triggerElement: HTMLElement | undefined

const open = (event: Event) => {
  if (isOpen.value) {
    return (isOpen.value = false)
  }

  isOpen.value = true

  const trigger = event.currentTarget as HTMLElement

  triggerElement = trigger

  nextTick(() => {
    clearClickOutsideEvent = onClickOutside(menu, () => (isOpen.value = false), {
      ignore: () => [trigger, '.menu-list'],
      controls: false,
    })

    const menuElement = unrefElement(menu)

    placeOverlay(trigger, menuElement, {
      placement: props.placement ?? defaultPlacement.value,
    })

    placementSide.value = menuElement.dataset.placement?.split('-')[0]

    focusFirstItem()
  })
}

function close() {
  if (document.activeElement?.closest('.menu-list')) {
    triggerElement?.focus()
  }

  isOpen.value = false
}
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
