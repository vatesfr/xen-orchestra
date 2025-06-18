<template>
  <div class="ui-quote-code" :class="className">
    <div class="label-container">
      <div :class="fontClasses.labelClass" class="label">
        {{ label }}
      </div>
      <div v-if="slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>
    <div :class="fontClasses.codeClass" class="code-container">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

type QuoteCodeAccent = 'brand' | 'danger'
type QuoteCodeSize = 'small' | 'medium'

const { size, accent } = defineProps<{
  label: string
  size: QuoteCodeSize
  accent: QuoteCodeAccent
}>()

const slots = defineSlots<{
  default(): any
  actions?(): any
}>()

const mapping = {
  small: {
    labelClass: 'typo-body-regular-small',
    codeClass: 'typo-form-value-small',
  },
  medium: {
    labelClass: 'typo-body-regular',
    codeClass: 'typo-form-value',
  },
}

const fontClasses = useMapper(() => size, mapping, 'medium')

const className = computed(() =>
  toVariants({
    accent,
  })
)
</script>

<style lang="postcss" scoped>
.ui-quote-code {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

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
    padding: 0.8rem 1.2rem;
    border-radius: 0.4rem;
    border-inline-start: 0.2rem solid;
  }

  &.accent--brand {
    .code-container {
      border-inline-start-color: var(--color-brand-item-base);
    }
  }

  &.accent--danger {
    .code-container {
      border-inline-start-color: var(--color-danger-item-base);
    }
  }
}
</style>
