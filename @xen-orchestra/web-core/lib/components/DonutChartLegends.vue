<template>
  <ul class="donut-chart-legends">
    <li v-for="legend in legends" :key="legend.label" class="legend">
      <span class="legend-dot" :class="legend.color"></span><span class="legend-text">{{ legend.label }}</span
      ><span class="legend-value">{{ legend.value }}</span>
    </li>
  </ul>
</template>
<script setup lang="ts">
import type { Color } from '@core/types/color.type.ts'

type Legend = {
  value: number
  color: Color | 'unknown'
  label: string
}

interface Props {
  legends: Legend[]
}

defineProps<Props>()
</script>
<style lang="postcss" scoped>
.donut-chart-legends {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  & .chart-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--color-grey-200);
  }

  & .legend {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    & .legend-dot {
      width: 0.8rem;
      height: 0.8rem;
      min-width: 0.8rem;
      border-radius: 50%;
    }

    & .legend-text {
      font-size: 1.3rem;
      font-weight: 400;
      color: var(--color-grey-000);
      width: 100%;
    }

    & .legend-value {
      font-weight: 600;
      font-size: 1.3rem;
      color: var(--color-grey-300);
    }
  }
}

.info {
  background-color: var(--color-purple-base);
}
.success {
  background-color: var(--color-green-base);
}
.warning {
  background-color: var(--color-orange-base);
}
.error {
  background-color: var(--color-red-base);
}
.unknown {
  background-color: var(--background-color-purple-10);
}
</style>
