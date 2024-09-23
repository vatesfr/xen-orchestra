<!-- v1.0 -->
<template>
  <div class="card-numbers" :class="size">
    <span class="label typo" :class="labelFontClass">{{ label }}</span>
    <div class="values" :class="size">
      <span v-if="percentValue" class="value typo c2-semi-bold">
        {{ percentValue }}
      </span>

      <div class="value typo" :class="valueFontClass">
        {{ value ?? '-' }}<span class="unit typo" :class="unitFontClass">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="TSize extends 'small' | 'medium'">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface CardNumbersProps {
  label: string
  size: TSize
  value?: number
  unit?: string
  max?: TSize extends 'small' ? number : never
}

const props = defineProps<CardNumbersProps>()

const { n } = useI18n()

const labelFontClass = computed(() => (props.size === 'medium' ? 'c3-semi-bold' : 'c2-semi-bold'))

const valueFontClass = computed(() => (props.size === 'medium' ? 'h3-semi-bold' : 'c2-semi-bold'))

const unitFontClass = computed(() => (props.size === 'medium' ? 'p2-medium' : 'c2-semi-bold'))

const percentValue = computed(() => {
  if (props.size !== 'small' || props.max === undefined || props.max === 0) {
    return undefined
  }

  if (props.value === undefined) {
    return n(0, 'percent').replace('0', '-')
  }

  return n(props.value / props.max, 'percent')
})
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.card-numbers {
  &.small {
    --label-color: var(--color-neutral-txt-primary);
  }

  &.medium {
    --label-color: var(--color-neutral-txt-secondary);
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
  color: var(--color-neutral-txt-primary);
  display: flex;
  gap: 0.2rem;
  align-items: center;
}

.unit {
  color: var(--color-neutral-txt-primary);
}
</style>
