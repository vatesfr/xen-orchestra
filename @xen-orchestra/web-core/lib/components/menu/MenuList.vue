<!-- v1.0 -->
<template>
  <slot :is-open="isOpen" :open="open" name="trigger" :is-header="false" />
  <MobileFullscreen :disabled="!hasTrigger" :isOpen="isOpen" @close="isOpen = false">
    <template #header>
      <slot name="trigger" :is-header="true" :is-open="false" :open="noop" />
    </template>
    <ul
      v-if="!hasTrigger || isOpen"
      ref="menu"
      :class="{ horizontal, shadow, mobile: isMobile }"
      class="menu-list"
      v-bind="$attrs"
    >
      <slot />
    </ul>
  </MobileFullscreen>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL, IK_MENU_TELEPORTED } from '@core/utils/injection-keys.util'
import placementJs, { type Options } from 'placement.js'
import { computed, inject, nextTick, provide, ref, useSlots } from 'vue'
import { noop, onClickOutside, unrefElement, whenever } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@core/stores/ui.store'
import MobileFullscreen from '@core/components/mobile-fullscreen/MobileFullscreen.vue'

const props = withDefaults(
  defineProps<{
    horizontal?: boolean
    shadow?: boolean
    disabled?: boolean
    placement?: Options['placement']
  }>(),
  { disabled: undefined }
)

defineOptions({
  inheritAttrs: false,
})

const slots = useSlots()
const { isMobile } = storeToRefs(useUiStore())
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
useContext(DisabledContext, () => props.disabled)

let clearClickOutsideEvent: (() => void) | undefined

const hasTrigger = useSlots().trigger !== undefined

const shouldTeleport = hasTrigger && !inject(IK_MENU_TELEPORTED, false) && !isMobile.value

if (shouldTeleport) {
  provide(IK_MENU_TELEPORTED, true)
}

whenever(
  () => !isOpen.value,
  () => clearClickOutsideEvent?.()
)
if (slots.trigger && inject(IK_CLOSE_MENU, undefined) === undefined) {
  provide(IK_CLOSE_MENU, () => (isOpen.value = false))
}

const open = (event: MouseEvent) => {
  if (isOpen.value) {
    return (isOpen.value = false)
  }

  isOpen.value = true

  if (isMobile.value) {
    return
  }
  nextTick(() => {
    clearClickOutsideEvent = onClickOutside(menu, () => (isOpen.value = false), {
      ignore: [event.currentTarget as HTMLElement],
    })

    placementJs(event.currentTarget as HTMLElement, unrefElement(menu), {
      placement: props.placement ?? (isParentHorizontal.value ? 'bottom-start' : 'right-start'),
    })
  })
}
</script>

<style lang="postcss" scoped>
.menu-list {
  z-index: 1;
  display: inline-flex;
  flex-direction: column;
  padding: 0.4rem;
  cursor: default;
  color: var(--color-grey-200);
  border-radius: 0.4rem;
  background-color: var(--color-grey-600);
  gap: 0.2rem;

  &.horizontal {
    flex-direction: row;
  }

  &.shadow {
    box-shadow: var(--shadow-300);
  }

  &:is(.mobile) {
    width: 100%;
  }
}
</style>
