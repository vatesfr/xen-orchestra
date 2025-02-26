<!-- v2 -->
<template>
  <label class="ui-toggle typo-caption">
    <slot />
    <span class="toggle-container">
      <input v-model="checked" :disabled="isDisabled || busy" class="input" type="checkbox" />
      <span :class="{ checked }" class="toggle-icon">
        <UiLoader :class="{ visible: busy }" class="spinner" />
      </span>
    </span>
  </label>
</template>

<script lang="ts" setup>
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import { useDisabled } from '@core/composables/disabled.composable'

const { busy, disabled } = defineProps<{
  disabled?: boolean
  busy?: boolean
}>()

const checked = defineModel<boolean>()

defineSlots<{
  default(): any
}>()

const isDisabled = useDisabled(() => disabled)
</script>

<style lang="postcss" scoped>
.ui-toggle {
  display: inline-flex;
  gap: 1.6rem;
  align-items: center;

  .toggle-container {
    --transition-timing: 0.25s ease-in-out;
    --border-color: var(--color-neutral-txt-secondary);
    height: 2rem;
    width: 4rem;
    background-color: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--border-color);
    border-radius: 1rem;
    transition:
      background-color var(--transition-timing),
      border-color var(--transition-timing);

    &:has(input:disabled) {
      --border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);
      cursor: not-allowed;
    }

    &:has(input:checked) {
      background-color: var(--color-success-item-base);
    }

    &:has(input:checked:disabled) {
      background-color: var(--color-success-item-disabled);
    }

    &:has(input:focus-visible) {
      outline: none;

      &::after {
        position: absolute;
        content: '';
        inset: -0.5rem;
        border: 0.2rem solid var(--color-brand-txt-base);
        border-radius: 0.4rem;
      }
    }
  }

  .input {
    position: absolute;
    pointer-events: none;
    opacity: 0;
  }

  .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    width: 2rem;
    height: 2rem;
    margin: -0.1rem 0 0 -0.1rem;
    color: var(--color-brand-txt-base);
    background-color: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--border-color);
    border-radius: 1rem;
    transition:
      transform var(--transition-timing),
      border-color var(--transition-timing);

    &.checked {
      transform: translateX(2rem);
    }
  }

  .spinner {
    opacity: 0;
    transition: opacity var(--transition-timing);

    &.visible {
      opacity: 1;
    }
  }
}
</style>
