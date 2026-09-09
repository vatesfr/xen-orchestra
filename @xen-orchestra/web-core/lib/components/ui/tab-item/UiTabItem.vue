<!-- v7 -->
<template>
  <component :is="resolvedTag" :class="className" class="ui-tab-item" :href="resolvedHref">
    <slot />
  </component>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const {
  tag: rawTag = 'span',
  disabled,
  active,
  href: rawHref,
} = defineProps<{
  disabled?: boolean
  active?: boolean
  tag?: string
  href?: string
}>()

const uiStore = useUiStore()

const isDisabled = useDisabled(() => disabled)

const resolvedTag = computed(() => {
  if (isDisabled.value || (rawTag === 'a' && !rawHref)) {
    return 'span'
  }

  return rawTag
})

const resolvedHref = computed(() => (resolvedTag.value === 'a' ? rawHref : undefined))

const className = computed(() => {
  return [
    uiStore.isSmall ? 'typo-h6' : 'typo-h5',
    {
      disabled: isDisabled.value,
      active,
    },
  ]
})
</script>

<style lang="postcss" scoped>
.ui-tab-item {
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.6rem;
  text-decoration: none;
  cursor: pointer;
  color: var(--color-neutral-txt-primary);
  background-color: transparent;
  border-block-end: 0.2rem solid transparent;

  &:is(:hover, .hover) {
    background-color: var(--color-brand-background-hover);
    border-block-end-color: var(--color-brand-item-hover);
  }

  &:focus-visible {
    position: relative;
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  &:is(:active, .pressed) {
    background-color: var(--color-brand-background-active);
    border-block-end-color: var(--color-brand-item-active);
  }

  &:is(.active, .selected) {
    background-color: var(--color-brand-background-selected);
    border-block-end-color: var(--color-brand-item-base);
  }

  &:is(:disabled, .disabled) {
    pointer-events: none;
    color: var(--color-neutral-txt-secondary);
    background-color: transparent;
    border-block-end-color: transparent;
  }

  @media (--small) {
    gap: 0.8rem;
    padding: 0.8rem;
  }
}
</style>
