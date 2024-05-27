<!-- v1.0 -->
<template>
  <div class="card-numbers" :class="{ column: size === 'medium' }">
    <span class="label typo" :class="labelFontClass">{{ label }}</span>
    <div class="value typo" :class="valueFontClass">
      {{ value }}<span class="unit typo p2-medium">{{ unit }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
interface CardNumbersProps {
  label: string
  value: number
  unit?: string
  size: 'small' | 'medium'
}

const props = withDefaults(defineProps<CardNumbersProps>(), {
  size: 'small',
})

const labelFontClass = computed(() => {
  return [
    props.size === 'medium' ? 'c3-semi-bold' : 'c2-semi-bold',
    {
      'grey-300': props.size === 'medium',
    },
  ]
})

const valueFontClass = computed(() => (props.size === 'medium' ? 'h3-semi-bold' : 'c2-semi-bold'))
</script>
<style lang="postcss" scoped>
.card-numbers {
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;

  & .label {
    color: var(--color-grey-100);
  }

  & .value {
    display: flex;
    gap: 0.2rem;
    align-items: center;

    & .value,
    & .unit {
      color: var(--color-grey-100);
    }
  }

  & .grey-300 {
    color: var(--color-grey-300);
  }
}

.column {
  flex-direction: column;
  gap: 0.4rem;
}
</style>
