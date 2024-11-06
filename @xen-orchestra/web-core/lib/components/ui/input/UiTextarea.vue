<!-- v2 -->
<template>
  <div class="ui-textarea">
    <UiLabel v-if="slots.default" :accent="labelAccent" :required :icon :href><slot /></UiLabel>
    <textarea v-model="model" :class="accent" :disabled class="textarea" v-bind="$attrs" />
    <UiInfo v-if="slots.info" :accent><slot name="info" /></UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  accent: 'info' | 'warning' | 'danger'
  disabled?: boolean
  href?: string
  icon?: IconDefinition
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const slots = defineSlots<{
  default?(): any
  info?(): any
}>()

const labelAccent = computed(() => (props.accent === 'info' ? 'neutral' : props.accent))
</script>

<style lang="postcss" scoped>
.ui-textarea {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .textarea {
    border-radius: 0.4rem;
    border-width: 0.1rem;
    background-color: var(--color-neutral-background-primary);
    height: 8rem;
    outline: none;
    padding: 0.8rem 1.6rem;
    width: 100%;

    &.info {
      border-color: var(--color-neutral-border);

      &:hover {
        border-color: var(--color-info-item-hover);
      }
      &:active {
        border-color: var(--color-info-item-active);
      }
      &:focus {
        border-width: 0.2rem;
        border-color: var(--color-info-item-base);
      }
      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }

    &.warning {
      border-color: var(--color-warning-item-base);

      &:hover {
        border-color: var(--color-warning-item-hover);
      }
      &:active {
        border-color: var(--color-warning-item-active);
      }
      &:focus {
        border-width: 0.2rem;
        border-color: var(--color-warning-item-base);
      }
      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }

    &.danger {
      border-color: var(--color-danger-item-base);

      &:hover {
        border-color: var(--color-danger-item-hover);
      }
      &:active {
        border-color: var(--color-danger-item-active);
      }
      &:focus {
        border-width: 0.2rem;
        border-color: var(--color-danger-item-base);
      }
      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }
}
</style>
