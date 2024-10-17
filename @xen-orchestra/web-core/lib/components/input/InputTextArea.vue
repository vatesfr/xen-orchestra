<!-- v1 -->
<template>
  <div class="vts-input-text-area">
    <VtsLabel v-if="$slots.default" :accent="labelAccent" :required :icon :href><slot /></VtsLabel>
    <textarea v-model="model" :class="accent" :disabled class="text-area" v-bind="$attrs" />
    <VtsInfo v-if="$slots.info" :accent><slot name="info" /></VtsInfo>
  </div>
</template>

<script lang="ts" setup>
import VtsInfo from '@core/components/info/VtsInfo.vue'
import VtsLabel from '@core/components/input/VtsLabel.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  disabled?: boolean
  href?: string
  icon?: IconDefinition
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

defineSlots<{
  default(): any
  label(): any
  info(): any
}>()

const labelAccent = computed(() => (props.disabled ? 'brand' : props.accent))
</script>

<style lang="postcss" scoped>
.text-area {
  border-radius: 0.4rem;
  border-width: 0.1rem;
  height: 8rem;
  outline: none;
  padding: 0.8rem 1.6rem;
  width: 100%;

  &:focus {
    border-width: 0.2rem;
  }

  &:disabled {
    background-color: var(--color-neutral-background-disabled);
    border-color: var(--color-neutral-border);
  }

  &.brand:not(:disabled) {
    border-color: var(--color-neutral-border);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-normal-item-hover);
    }

    &:active {
      border-color: var(--color-normal-item-active);
    }
  }

  &.warning:not(:disabled) {
    border-color: var(--color-warning-item-base);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-warning-item-hover);
    }
    &:active {
      border-color: var(--color-warning-item-active);
    }
  }

  &.danger:not(:disabled) {
    border-color: var(--color-danger-item-base);

    &:is(:hover, :focus-visible) {
      border-color: var(--color-danger-item-hover);
    }
    &:active {
      border-color: var(--color-danger-item-active);
    }
  }
}
</style>
