<!-- v2 -->
<template>
  <component :is="tag" :class="classNames" class="vts-tab-item">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    selected?: boolean
    tag?: string
  }>(),
  { tag: 'span', disabled: undefined }
)

defineSlots<{
  default(): any
}>()

const { isMobile } = storeToRefs(useUiStore())

const isDisabled = useContext(DisabledContext, () => props.disabled)

const classNames = computed(() => {
  return [
    isMobile.value ? 'typo c3-semi-bold' : 'typo c1-semi-bold',
    {
      disabled: isDisabled.value,
      selected: props.selected,
      mobile: isMobile.value,
    },
  ]
})
</script>

<style lang="postcss" scoped>
.vts-tab-item {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.6rem;
  text-decoration: none;
  color: var(--color-neutral-txt-primary);
  border-bottom: 0.2rem solid transparent;
  cursor: pointer;

  &.mobile {
    gap: 0.8rem;
    padding: 0.8rem;
  }

  /* INTERACTION VARIANTS */

  &:hover {
    border-color: var(--color-normal-item-hover);
    background-color: var(--color-normal-background-hover);
  }

  &:active {
    border-color: var(--color-normal-item-active);
    background-color: var(--color-normal-background-active);
  }

  &.selected {
    border-color: var(--color-normal-item-base);
    background-color: var(--color-normal-background-selected);
  }

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    border-color: transparent;
    background-color: transparent;
    pointer-events: none;
  }
}
</style>
