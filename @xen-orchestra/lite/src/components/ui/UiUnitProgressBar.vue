<template>
  <p class="unit">
    <span>0%</span>
    <span>{{ maxValue / 2 }}%</span>
    <span>{{ maxValue }}%</span>
  </p>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    maxValue?: number;
  }>(),
  { maxValue: 100 }
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
