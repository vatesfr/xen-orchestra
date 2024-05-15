<template>
  <div class="wrapper">
    <div class="donut-chart" :style="gradientStyle">
      <span class="donut-hole"><UiIcon v-if="icon" :icon="icon" class="chart-icon" /></span>
    </div>

    <ul class="chart-legends">
      <h3 v-if="title" class="chart-title">{{ title }}</h3>
      <li class="legend" v-for="legend in chartFigures" :key="legend.legend">
        <span class="legend-dot" :class="legend.color"></span><span class="legend-text">{{ legend.legend }}</span
        ><span class="legend-value">{{ legend.value }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

type ChartFigure = {
  value: number
  color: string
  legend: string
}

interface Props {
  chartFigures: ChartFigure[]
  title?: string
  icon?: IconDefinition
}

const props = withDefaults(defineProps<Props>(), {
  chartFigures: () => [
    {
      value: 1,
      color: 'unknown',
      legend: 'Unknown',
    },
  ],
})

const totalValue = props.chartFigures.reduce((acc, chartFigure) => acc + chartFigure.value, 0)

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
  let gradientStr = 'background: conic-gradient('
  props.chartFigures.forEach((figure, index) => {
    const nextPercent = (figure.value / totalValue) * 100
    if (index > 0) {
      gradientStr += `, ${convertColorToVar(figure.color)} ${cumulativePercent}% ${cumulativePercent + nextPercent}%`
    } else {
      gradientStr += `${convertColorToVar(figure.color)} 0% ${nextPercent}%`
    }
    cumulativePercent += nextPercent
  })
  gradientStr += ')'
  return gradientStr
})
</script>
<style lang="postcss" scoped>
.wrapper {
  display: flex;
  align-items: center;
  gap: 2.4rem;

  & .donut-chart {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;

    & .donut-hole {
      width: 80%;
      height: 80%;
      background-color: var(--background-color-primary);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;

      & .chart-icon {
        font-size: 2.4rem;
      }
    }
  }

  & .chart-legends {
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
        font-size: 1.2rem;
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
