<!-- v1 -->
<template>
  <div class="ui-card-numbers" :class="className">
    <span class="label typo-caption-small">{{ label }}</span>
    <div class="values" :class="fontClass">
      <span v-if="percentValue !== undefined">
        {{ $n(percentValue, 'percent') }}
      </span>
      <span>
        {{ `${value ?? '-'} ${unit ?? ''}` }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toVariants } from '@core/utils/to-variants.util'
import { computed } from 'vue'

const { size, value, max } = defineProps<{
  label: string
  size: 'small' | 'medium'
  value?: number
  unit?: string
  max?: number
}>()

const className = computed(() => toVariants({ size }))
const fontClass = computed(() => (size === 'medium' ? 'typo-h3' : 'typo-caption-small'))

const percentValue = computed(() => {
  if (value === undefined || max === undefined || max === 0) {
    return undefined
  }

  return value / max
})
</script>

<style lang="postcss" scoped>
.ui-card-numbers {
  display: flex;
  width: fit-content;

  .values {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    color: var(--color-neutral-txt-primary);
  }

  /* SIZE VARIANTS */

  &.size--small {
    gap: 0.8rem;
    flex-direction: row;

    .label {
      color: var(--color-neutral-txt-primary);
    }

    .values {
      align-items: flex-end;
    }
  }

  &.size--medium {
    gap: 0.4rem;
    flex-direction: column;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .values {
      align-items: flex-start;
    }
  }
}
</style>
