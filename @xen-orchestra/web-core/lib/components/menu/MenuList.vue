<!-- v1.0 -->
<template>
  <slot :is-open="isOpen" :open="open" name="trigger" />
  <Teleport :disabled="!shouldTeleport" to="body">
    <ul v-if="!hasTrigger || isOpen" ref="menu" :class="{ horizontal, border }" class="menu-list" v-bind="$attrs">
      <slot />
    </ul>
  </Teleport>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable'
import { IK_CLOSE_MENU, IK_MENU_HORIZONTAL, IK_MENU_TELEPORTED } from '@core/utils/injection-keys.util'
import { onClickOutside, unrefElement, whenever } from '@vueuse/core'
import placementJs, { type Options } from 'placement.js'
import { computed, inject, nextTick, provide, ref, useSlots } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  horizontal?: boolean
  border?: boolean
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

let clearClickOutsideEvent: (() => void) | undefined

const hasTrigger = useSlots().trigger !== undefined

const shouldTeleport = hasTrigger && !inject(IK_MENU_TELEPORTED, false)

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
  color: var(--color-neutral-txt-primary);
  border-radius: 0.4rem;
  background-color: var(--color-neutral-background-primary);
  gap: 0.2rem;

  &.horizontal {
    flex-direction: row;
  }

  &.border {
    border: 0.1rem solid var(--color-neutral-border);
  }
}
</style>
