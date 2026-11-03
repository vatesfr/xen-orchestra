<template>
  <VueCharts :option autoresize class="vts-bar-chart" />
</template>

<script lang="ts" setup>
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
import { timeFormat } from 'd3-time-format'
import type { EChartsOption } from 'echarts'
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VueCharts from 'vue-echarts'

// VtsLinearChart's data as bars over time: for counts per interval, where
// an interval without data is no bar rather than a broken line. stacked:
// the series one on the other (the bar is their total)
const {
  data,
  valueFormatter: _valueFormatter,
  maxValue,
  timeFormatter,
  timeMinInterval,
  stacked = false,
} = defineProps<{
  data: LinearChartData
  valueFormatter?: ValueFormatter
  maxValue?: number
  // the x-axis labels, for windows of minutes rather than days
  timeFormatter?: (timestamp: number) => string
  // the smallest step between x-axis ticks, in ms (labels without seconds)
  timeMinInterval?: number
  stacked?: boolean
}>()

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
  series: data.map(series => ({
    type: 'bar',
    name: series.label,
    stack: stacked ? 'total' : undefined,
    // few intervals: wide bars, still apart
    barMaxWidth: 48,
    data: series.data.map(item => [item.timestamp, isNaN(item.value ?? NaN) ? null : item.value]),
  })),
}))
</script>

<style lang="postcss" scoped>
.vts-bar-chart {
  width: 100%;
  height: 30rem;
}
</style>
