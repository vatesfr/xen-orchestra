<template>
  <VueCharts :option autoresize class="vts-bar-chart" />
</template>

<script lang="ts" setup>
import { useUiStore } from '@core/stores/ui.store.ts'
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
import { timeFormat } from 'd3-time-format'
import type { EChartsOption } from 'echarts'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import VueCharts from 'vue-echarts'

// VtsLinearChart's data as bars over time: for counts per interval, where
// an interval without data is no bar rather than a broken line. stacked:
// the series one on the other (the bar is their total). colors: a color
// token per series (--color-…), for series whose color means something
// (the theme's otherwise), followed across light and dark modes
const {
  data,
  valueFormatter: _valueFormatter,
  maxValue,
  timeFormatter,
  timeMinInterval,
  stacked = false,
  colors,
} = defineProps<{
  data: LinearChartData
  valueFormatter?: ValueFormatter
  maxValue?: number
  // the x-axis labels, for windows of minutes rather than days
  timeFormatter?: (timestamp: number) => string
  // the smallest step between x-axis ticks, in ms (labels without seconds)
  timeMinInterval?: number
  stacked?: boolean
  colors?: string[]
}>()

const { colorMode } = storeToRefs(useUiStore())

const resolvedColors = computed(() => {
  // a dependency: the tokens' values change with the mode
  void colorMode.value

  if (colors === undefined) {
    return undefined
  }

  const style = window.getComputedStyle(window.document.documentElement)
  const values = colors.map(token => style.getPropertyValue(token).trim())

  // a token unknown: the theme's colors
  return values.every(value => value !== '') ? values : undefined
})

const xAxisLabelFormatter = timeFormat('%a\n%H:%M')

const valueFormatter = computed<ValueFormatter>(() => {
  const formatter = _valueFormatter

  return value => {
    if (value === null) {
      return ''
    }

    return formatter === undefined ? value.toString() : formatter(value)
  }
})

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

// a #rrggbb color with an alpha (the color as is otherwise)
function withAlpha<T extends string | undefined>(color: T, alpha: number): T {
  const match = color?.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)

  return (
    match === null || match === undefined
      ? color
      : `rgba(${match
          .slice(1)
          .map(hex => parseInt(hex, 16))
          .join(', ')}, ${alpha})`
  ) as T
}

// a bar in its color at the top, lighter toward the axis, its top corners
// rounded: a stack reads as segments
function barStyle(color: string | undefined) {
  return {
    borderRadius: [4, 4, 0, 0],
    ...(color === undefined
      ? {}
      : {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color },
              { offset: 1, color: withAlpha(color, 0.45) },
            ],
          },
        }),
  }
}

// the interval between two bars (the smallest step between timestamps): the
// axis reaches half of it past the first and the last, which a time axis
// would cut in half
const extent = computed(() => {
  const timestamps = [...new Set(data.flatMap(series => series.data.map(item => item.timestamp)))].sort(
    (timestampA, timestampB) => timestampA - timestampB
  )
  const steps = timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index])

  return {
    first: timestamps[0],
    last: timestamps.at(-1),
    step: steps.length === 0 ? undefined : Math.min(...steps),
  }
})

const valueOf = (value: number | null | undefined) => (value === null || value === undefined || isNaN(value) ? null : value)

// stacked: only a stack's top segment has rounded corners (a thin one
// rounded under another reads as a narrower bar)
const topSeries = computed(() => {
  const top = new Map<number, number>()

  data.forEach((series, index) =>
    series.data.forEach(item => {
      if ((valueOf(item.value) ?? 0) > 0) {
        top.set(item.timestamp, index)
      }
    })
  )

  return top
})

const option = computed<EChartsOption>(() => ({
  legend: {
    data: data.map(series => series.label),
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    valueFormatter: value => valueFormatter.value(value as number),
    confine: true,
  },
  xAxis: {
    type: 'time',
    minInterval: timeMinInterval,
    ...(extent.value.step === undefined
      ? {}
      : { min: extent.value.first! - extent.value.step / 2, max: extent.value.last! + extent.value.step / 2 }),
    axisLabel: {
      formatter: (timestamp: number) => timeFormatter?.(timestamp) ?? xAxisLabelFormatter(new Date(timestamp)),
      showMaxLabel: false,
      showMinLabel: false,
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: valueFormatter.value,
    },
    max: maxValue,
  },
  ...(resolvedColors.value === undefined ? {} : { color: resolvedColors.value }),
  series: data.map((series, index) => ({
    type: 'bar',
    name: series.label,
    stack: stacked ? 'total' : undefined,
    itemStyle: barStyle(resolvedColors.value?.[index]),
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: withAlpha(resolvedColors.value?.[index], 0.5) } },
    // few intervals: wide bars, still apart
    barMaxWidth: 48,
    data: series.data.map(item =>
      stacked && topSeries.value.get(item.timestamp) !== index
        ? { value: [item.timestamp, valueOf(item.value)], itemStyle: { borderRadius: 0 } }
        : [item.timestamp, valueOf(item.value)]
    ),
  })),
}))
</script>

<style lang="postcss" scoped>
.vts-bar-chart {
  width: 100%;
  height: 30rem;
}
</style>
