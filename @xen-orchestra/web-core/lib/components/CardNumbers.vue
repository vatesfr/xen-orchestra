<template>
  <!-- v1.0.1 -->
  <div class="card-numbers" :class="{ column: size === 'medium' }">
    <span
      class="label typo c2-semi-bold"
      :class="{ 'c3-semi-bold': size === 'medium', 'grey-300': size === 'medium' }"
      >{{ label }}</span
    >
    <div class="value typo c2-semi-bold" :class="{ 'h3-semi-bold': size === 'medium' }">
      {{ value }}<span class="unit typo p2-medium">{{ unit }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
interface CardNumbersProps {
  label: string
  value: number
  unit?: string
  size?: 'small' | 'medium'
}

defineProps<CardNumbersProps>()
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
