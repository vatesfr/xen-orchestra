<!-- v2 -->
<template>
  <div class="ui-textarea" :class="toVariants({ accent })">
    <UiLabel v-if="slots.default" :accent="labelAccent" :required :icon :href>
      <slot />
    </UiLabel>
    <textarea v-model="model" :disabled class="textarea" v-bind="attrs" />
    <slot name="character-limit" />
    <UiInfo v-if="slots.info" :accent="accent === 'brand' ? 'info' : accent">
      <slot name="info" />
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const { accent } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  disabled?: boolean
  href?: string
  icon?: IconDefinition
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const slots = defineSlots<{
  default?(): any
  'character-limit'?(): any
  info?(): any
}>()

const attrs = useAttrs()

const labelAccent = computed(() => (accent === 'brand' ? 'neutral' : accent))
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
  }

  &.accent--brand {
    .textarea {
      border-color: var(--color-neutral-border);

      &:hover {
        border-color: var(--color-brand-item-hover);
      }

      &:active {
        border-color: var(--color-brand-item-active);
      }

      &:focus:not(:active) {
        border-width: 0.2rem;
        border-color: var(--color-brand-item-base);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }

  &.accent--warning {
    .textarea {
      border-color: var(--color-warning-item-base);

      &:hover {
        border-color: var(--color-warning-item-hover);
      }

      &:active {
        border-color: var(--color-warning-item-active);
      }

      &:focus:not(:active) {
        border-width: 0.2rem;
        border-color: var(--color-warning-item-base);
      }

      &:disabled {
        background-color: var(--color-neutral-background-disabled);
        border-color: var(--color-neutral-border);
      }
    }
  }

  &.accent--danger {
    .textarea {
      border-color: var(--color-danger-item-base);

      &:hover {
        border-color: var(--color-danger-item-hover);
      }

      &:active {
        border-color: var(--color-danger-item-active);
      }

      &:focus:not(:active) {
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
