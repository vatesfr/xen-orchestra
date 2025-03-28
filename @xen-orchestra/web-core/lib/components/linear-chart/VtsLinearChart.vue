<template>
  <VueCharts :option autoresize class="vts-linear-chart" />
</template>

<script lang="ts" setup>
import type { LinearChartData, ValueFormatter } from '@core/types/chart'
import { utcFormat } from 'd3-time-format'
import type { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VueCharts from 'vue-echarts'

const {
  data,
  valueFormatter: _valueFormatter,
  maxValue,
} = defineProps<{
  data: LinearChartData
  valueFormatter?: ValueFormatter
  maxValue?: number
}>()

const Y_AXIS_MAX_VALUE = 200

const valueFormatter = computed<ValueFormatter>(() => {
  const formatter = _valueFormatter

  return value => {
    if (formatter === undefined) {
      return value.toString()
    }

    return formatter(value)
  }
})

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const option = computed<EChartsOption>(() => ({
  legend: {
    data: data.map(series => series.label),
  },
  tooltip: {
    valueFormatter: v => valueFormatter.value(v as number),
  },
  xAxis: {
    type: 'time',
    axisLabel: {
      formatter: (timestamp: number) => utcFormat('%a\n%I:%M\n%p')(new Date(timestamp)),
      showMaxLabel: false,
      showMinLabel: false,
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: valueFormatter.value,
    },
    max: maxValue ?? Y_AXIS_MAX_VALUE,
  },
  series: data.map((series, index) => ({
    type: 'line',
    name: series.label,
    zlevel: index + 1,
    data: series.data.map(item => [item.timestamp, item.value]),
  })),
}))
</script>

<style lang="postcss" scoped>
.vts-linear-chart {
  width: 100%;
  height: 30rem;
}
</style>
