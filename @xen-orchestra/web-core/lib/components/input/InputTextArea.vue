<!-- v1 -->
<template>
  <div class="vts-input-text-area">
    <InputLabel v-if="$slots.default" :status :required :icon :href><slot /></InputLabel>
    <textarea v-model="model" :class="status" class="text-area" v-bind="$attrs" />
    <!-- TODO info V2 -->
  </div>
</template>

<script lang="ts" setup>
import InputLabel from '@core/components/input/InputLabel.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  status: 'normal' | 'warning' | 'danger'
  icon?: IconDefinition
  required?: boolean
  href?: string
}>()

const model = defineModel<string>({ required: true })

defineSlots<{
  default(): any
  label(): any
}>()
</script>

<style lang="postcss" scoped>
/* VARIANTS */
.text-area {
  --background-color: var(--color-neutral-background-primary);
  --border-width: 0.1rem;

  &:focus {
    --border-width: 0.2rem;
  }

  &:disabled {
    --background-color: var(--color-neutral-background-disabled);
    --border-color: var(--color-neutral-border);
  }

  &.normal:not(:disabled) {
    --border-color: var(--color-neutral-border);

    &:is(:hover, :focus-visible) {
      --border-color: var(--color-normal-item-hover);
    }
    &:active {
      --border-color: var(--color-normal-item-active);
    }
  }

  &.warning:not(:disabled) {
    --border-color: var(--color-warning-item-base);

    &:is(:hover, :focus-visible) {
      --border-color: var(--color-warning-item-hover);
    }
    &:active {
      --border-color: var(--color-warning-item-active);
    }
  }

  &.danger:not(:disabled) {
    --border-color: var(--color-danger-item-base);

    &:is(:hover, :focus-visible) {
      --border-color: var(--color-danger-item-hover);
    }
    &:active {
      --border-color: var(--color-danger-item-active);
    }
  }
}

/* IMPLEMENTATION */
.text-area {
  border-radius: 0.4rem;
  height: 8rem;
  padding: 0.8rem 1.6rem;
  width: 100%;
  outline: none;

  border-color: var(--border-color);
  border-width: var(--border-width);
}
</style>
