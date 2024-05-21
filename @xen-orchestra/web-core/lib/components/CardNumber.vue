<!-- v1.0 -->
<template>
  <div class="card-number">
    <span class="label">{{ label }}</span>
    <div class="value">
      {{ value }}<span class="unit">{{ unit }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps({
  label: { type: String, default: 'CARD LABEL' },
  value: { type: Number, default: 0 },
  unit: { type: String, default: 'GB' },
})
</script>
<style lang="postcss" scoped>
.card-number {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  & .label {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-grey-300);
  }

  & .value {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    color: var(--color-grey-100);
    font-size: 2.4rem;
    font-weight: 600;

    & .unit {
      color: var(--color-grey-100);
    }
  }
}
</style>
