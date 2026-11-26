<!-- v6 -->
<template>
  <th :class="{ interactive }" class="ui-column-header typo-caption" scope="col">
    <button
      v-if="interactive"
      :class="{ selected }"
      :disabled="isDisabled"
      class="button"
      type="button"
      v-bind="buttonAttrs"
      @click="emit('click', $event)"
    >
      <slot />
      <VtsIcon :name="icon" size="small" />
    </button>
    <slot v-else />
  </th>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import type { ButtonHTMLAttributes } from 'vue'

const { disabled } = defineProps<{
  interactive: boolean
  selected: boolean
  disabled?: boolean
  icon?: IconName
  buttonAttrs?: ButtonHTMLAttributes
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

defineSlots<{
  default(): any
}>()

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-column-header {
  max-width: 30rem;
  padding: 0.8rem 1.2rem;
  border-block-start: 0.1rem solid var(--color-neutral-border);
  border-inline-end: 0.1rem solid var(--color-neutral-border);
  text-align: start;
  color: var(--color-brand-txt-base);
  background-color: var(--color-neutral-background-primary);

  &:last-child {
    border-inline-end: none;
  }

  &.interactive {
    padding: 0;
  }

  .button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    width: 100%;
    padding: 0.8rem 1.2rem;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: start;
    cursor: pointer;

    &:hover {
      background-color: var(--color-brand-background-hover);
      color: var(--color-brand-txt-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
      color: var(--color-brand-txt-active);
    }

    &.selected {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);
    }

    &:focus-visible {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: 0.2rem;
        border: 0.2rem solid var(--color-brand-txt-base);
        border-radius: 0.4rem;
      }
    }

    &:disabled {
      cursor: not-allowed;
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
