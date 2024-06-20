<!-- v1.0 -->
<template>
  <div class="card-numbers" :class="size">
    <span class="label typo" :class="labelFontClass">{{ label }}</span>
    <div class="values" :class="size">
      <span v-if="size === 'small' && max" class="value typo c2-semi-bold">
        {{ $n(valueAsPercentage, 'percent') }}
      </span>

      <div class="value typo" :class="valueFontClass">
        {{ value }}<span class="unit typo" :class="unitFontClass">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TSize extends 'small' | 'medium'">
import { computed } from 'vue'

interface CardNumbersProps {
  label: string
  value: number
  size: TSize
  unit?: string
  max?: TSize extends 'small' ? number : never
}

const props = defineProps<CardNumbersProps>()

const labelFontClass = computed(() => (props.size === 'medium' ? 'c3-semi-bold' : 'c2-semi-bold'))

const valueFontClass = computed(() => (props.size === 'medium' ? 'h3-semi-bold' : 'c2-semi-bold'))

const unitFontClass = computed(() => (props.size === 'medium' ? 'p2-medium' : 'c2-semi-bold'))

const valueAsPercentage = computed(() => {
  if (props.max === undefined) {
    return 0
  }

  return props.value / props.max
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.card-numbers {
  &.small {
    --label-color: var(--color-grey-100);
  }

  &.medium {
    --label-color: var(--color-grey-300);
  }
}

/* IMPLEMENTATION */
.card-numbers {
  display: flex;
  gap: 0.8rem;
  width: fit-content;

  &.medium {
    flex-direction: column;
    gap: 0.4rem;
  }
}

.label {
  color: var(--label-color);
}

.values {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: flex-end;

  &.medium {
    align-items: flex-start;
  }
}

.value {
  color: var(--color-grey-100);
  display: flex;
  gap: 0.2rem;
  align-items: center;
}

.unit {
  color: var(--color-grey-100);
}
</style>
