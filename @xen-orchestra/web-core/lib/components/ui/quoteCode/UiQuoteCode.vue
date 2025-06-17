<template>
  <div class="ui-quote-code">
    <div :class="classNames" class="typo-body-regular label-container">
      <div class="label">
        <slot />
      </div>
      <div v-if="slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>
    <div :class="classNames" class="code-container">
      {{ code }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

type quoteCodeAccent = 'brand' | 'error'
type quoteCodeSize = 'small' | 'medium'

const { size, accent } = defineProps<{
  code: string
  size: quoteCodeSize
  accent: quoteCodeAccent
}>()

const slots = defineSlots<{
  default(): any
  actions?(): any
}>()

const fontClasses = {
  small: 'typo-body-bold-small',
  medium: 'typo-body-bold',
}

const classNames = computed(() => {
  return [
    fontClasses[size],
    toVariants({
      size,
      accent,
    }),
  ]
})
</script>

<style lang="postcss" scoped>
.ui-quote-code {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .label-container {
    display: flex;
    justify-content: space-between;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .actions {
      display: flex;
      gap: 0.8rem;
      align-items: center;
    }
  }

  .code-container {
    background-color: var(--color-neutral-background-disabled);
    padding-block: 0.8rem;
    padding-inline: 1.2rem;
    border-radius: 0.4rem;

    &.accent--brand {
      border-inline-start: 0.2rem solid var(--color-brand-item-base);
    }

    &.accent--error {
      border-inline-start: 0.2rem solid var(--color-danger-item-base);
    }
  }
}
</style>
