<template>
  <p class="unit">
    <span>0{{ unit }}</span>
    <span v-for="step in steps" :key="step">
      {{ Math.round((maxValue / (steps + 1)) * step) }}{{ unit }}
    </span>
    <span>{{ maxValue }}{{ unit }}</span>
  </p>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    maxValue?: number;
    steps?: number;
    unit?: string;
  }>(),
  { maxValue: 100, steps: 1 }
);
</script>

<style lang="postcss">
.unit {
  color: var(--color-blue-scale-300);
  display: flex;
  font-size: 12px;
  font-weight: 400;
  justify-content: space-between;
  letter-spacing: 0.04em;
  line-height: 16px;
}
</style>
