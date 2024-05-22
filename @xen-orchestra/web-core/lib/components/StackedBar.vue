<!-- v1.0.0 -->
<template>
  <div class="multi-progress-bar">
    <div class="wrapper">
      <div
        v-for="(segment, index) in segments"
        :key="index"
        :style="{ width: (segment.value / accurateMaxValue) * 100 + '%' }"
        class="segment typo c4-semi-bold"
        :class="segment.color"
      >
        {{ ((segment.value / accurateMaxValue) * 100).toFixed(2) }} %
      </div>
      <div
        v-if="availableSegmentValue > 0"
        :style="{ width: availableSegmentValue + '%' }"
        class="segment available typo c4-semi-bold"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Color } from '@core/types/color.type'

type StackedBarDataType = {
  value: number
  color: Color
}

const props = defineProps<{
  segments: StackedBarDataType[]
  maxValue: number
}>()

const totalValue = computed(() => props.segments.reduce((acc, bar) => acc + bar.value, 0))

const accurateMaxValue = computed(() => {
  return props.maxValue > totalValue.value && props.maxValue !== 0 ? props.maxValue : totalValue.value
})

const availableSegmentValue = computed(() => {
  return props.maxValue > totalValue.value ? props.maxValue - totalValue.value : 0
})
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
