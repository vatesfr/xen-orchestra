<template>
  <!-- Stacked bar v1.0.0 -->
  <div class="multi-progress-bar">
    <div class="wrapper">
      <div
        v-for="(barSegment, index) in progressBarData"
        :key="index"
        :style="{ width: (barSegment.value / accurateMaxValue) * 100 + '%' }"
        class="segment"
        :class="barSegment.color"
      >
        {{ ((barSegment.value / accurateMaxValue) * 100).toFixed(2) }} %
      </div>
      <div :style="{ width: availableSegmentValue + '%' }" class="segment available"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Color } from '@core/types/color.type'

type progressBarDataType = {
  value: number
  color: Color
}

const props = defineProps<{
  progressBarData: progressBarDataType[]
  maxValue: number
}>()

const progressBarData = ref<progressBarDataType[]>(props.progressBarData)

const accurateMaxValue = computed(() => {
  return props.maxValue > totalValue && props.maxValue !== 0 ? props.maxValue : totalValue
})

const totalValue = progressBarData.value.reduce((acc, bar) => acc + bar.value, 0)

const availableSegmentValue = props.maxValue > totalValue ? props.maxValue - totalValue : 0
</script>

<style scoped lang="postcss">
.multi-progress-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  & .wrapper {
    display: flex;
    height: 40px;
    border-radius: 0.8rem;
    overflow: hidden;
    width: 100%;

    & .segment {
      flex-grow: 1;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--color-grey-600);
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
.available {
  background-color: var(--background-color-purple-10);
}
</style>
