<!-- v1.0-->
<template>
  <div class="stacked-bar">
    <div class="wrapper">
      <div
        v-for="(segment, index) in computedSegments"
        :key="index"
        ref="segmentRefs"
        v-tooltip="
          shouldShowTooltip(index)
            ? {
                placement: 'top',
                content: $t(segment.percentage.toFixed(0) + '%'),
              }
            : false
        "
        :style="{ width: segment.percentage + '%' }"
        class="segment typo c4-semi-bold"
        :class="segment.color"
      >
        <span class="segment-text">{{ segment.percentage.toFixed(0) }} %</span>
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Color } from '@core/types/color.type'
import { vTooltip } from '@core/directives/tooltip.directive'

type StackedBarDataType = {
  value: number
  color: Color
}

const props = defineProps<{
  segments: StackedBarDataType[]
  maxValue: number
}>()

const segmentRefs = ref<HTMLElement[] | null>(null)
const minWidth = 40

const totalValue = computed(() => props.segments.reduce((acc, bar) => acc + bar.value, 0))

const accurateMaxValue = computed(() => {
  return props.maxValue > totalValue.value && props.maxValue !== 0 ? props.maxValue : totalValue.value
})

const availableSegmentValue = computed(() => {
  return props.maxValue > totalValue.value ? props.maxValue - totalValue.value : 0
})

const computedSegments = computed(() => {
  return props.segments.map(segment => ({
    ...segment,
    percentage: (segment.value / accurateMaxValue.value) * 100,
  }))
})

function setHideClass() {
  segmentRefs.value?.forEach((segment: HTMLElement) => {
    if (segment.offsetWidth < minWidth) {
      segment.classList.add('hide-text')
    } else {
      segment.classList.remove('hide-text')
    }
  })
}

function shouldShowTooltip(index: number): boolean {
  if (segmentRefs.value === null) return false

  return segmentRefs.value[index]?.classList.contains('hide-text')
}

onMounted(() => {
  setHideClass()
  window.addEventListener('resize', setHideClass)
})

onUnmounted(() => {
  window.removeEventListener('resize', setHideClass)
})
</script>

<style scoped lang="postcss">
.stacked-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.wrapper {
  display: flex;
  height: 40px;
  border-radius: 0.8rem;
  overflow: hidden;
  width: 100%;
}

.segment {
  flex-grow: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  color: var(--color-grey-600);
  background-color: var(--segment-background-color);

  &.info {
    --segment-background-color: var(--color-purple-base);
  }
  &.success {
    --segment-background-color: var(--color-green-base);
  }
  &.warning {
    --segment-background-color: var(--color-orange-base);
  }
  &.error {
    --segment-background-color: var(--color-red-base);
  }
  &.available {
    --segment-background-color: var(--background-color-purple-10);
  }
}

/* Hide text if segment is too narrow */
.hide-text .segment-text {
  display: none;
}
</style>
