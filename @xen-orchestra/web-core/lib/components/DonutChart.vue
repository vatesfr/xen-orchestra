<template>
  <!-- v1.1 -->
  <div class="wrapper">
    <div class="donut-chart" :style="gradientStyle">
      <svg
        id="donut-clip"
        clipPathUnits="objectBoundingBox"
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="mask">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M50 100C77.6143 100 100 77.6143 100 50C100 22.3857 77.6143 0 50 0C22.3857 0 0 22.3857 0 50C0 77.6143 22.3857 100 50 100ZM50.5 88C71.2104 88 88 71.2109 88 50.5C88 29.7891 71.2104 13 50.5 13C29.7896 13 13 29.7891 13 50.5C13 71.2109 29.7896 88 50.5 88Z"
              fill="#D9D9D9"
            />
          </mask>
        </defs>
      </svg>
    </div>
    <UiIcon :icon="icon" class="chart-icon" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import type { Color } from '@core/types/color.type.ts'

type ChartFigure = {
  value: number
  color: Color | 'unknown'
}

interface Props {
  segments: ChartFigure[]
  maxValue?: number
  icon?: IconDefinition
}

const props = defineProps<Props>()

const totalValue = computed(() => {
  const sumOfValues = props.segments.reduce((acc, segment) => acc + segment.value, 0)
  return props.maxValue !== undefined && props.maxValue >= sumOfValues
    ? props.maxValue
    : props.segments.reduce((acc, segment) => acc + segment.value, 0)
})

function convertColorToVar(color: string) {
  switch (color) {
    case 'info':
      return 'var(--color-purple-base)'
    case 'success':
      return 'var(--color-green-base)'
    case 'warning':
      return 'var(--color-orange-base)'
    case 'error':
      return 'var(--color-red-base)'
    case 'unknown':
      return 'var(--background-color-purple-10)'
    default:
      return 'var(--background-color-primary)'
  }
}

const gradientStyle = computed(() => {
  let cumulativePercent = 0
  const parts = props.segments.map(figure => {
    const currentPercent = cumulativePercent
    cumulativePercent += (figure.value / totalValue.value) * 100
    return `${convertColorToVar(figure.color)} ${currentPercent}% ${cumulativePercent}%`
  })
  return { background: `conic-gradient(${parts.join(', ')}` }
})
</script>
<style lang="postcss" scoped>
.wrapper {
  position: relative;
  width: fit-content;
  border-radius: 50%;
  overflow: hidden;

  & .donut-chart {
    width: 100px;
    height: 100px;
    -webkit-mask-image: url(#mask);
    mask-image: url(#mask);
  }

  & .chart-icon {
    font-size: 2.4rem;
    position: absolute;
    inset: 0;
    margin: auto;
  }
}
</style>
