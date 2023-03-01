<template>
  <UiCard class="linear-chart">
    <VueCharts :option="option" autoresize class="chart" />
    <slot name="summary" />
  </UiCard>
</template>

<script lang="ts" setup>
import { utcFormat } from "d3-time-format";
import type { EChartsOption } from "echarts";
import { computed, provide } from "vue";
import VueCharts from "vue-echarts";
import type { LinearChartData } from "@/types/chart";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { OptionDataValue } from "echarts/types/src/util/types";
import UiCard from "@/components/ui/UiCard.vue";

const Y_AXIS_MAX_VALUE = 200;

const props = defineProps<{
  title?: string;
  subtitle?: string;
  data: LinearChartData;
  valueFormatter?: (value: number) => string;
  maxValue?: number;
}>();

const valueFormatter = computed(() => {
  const formatter = props.valueFormatter;

  return (value: OptionDataValue | OptionDataValue[]) => {
    if (formatter) {
      return formatter(value as number);
    }

    return value.toString();
  };
});

provide("valueFormatter", valueFormatter);

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
]);

const option = computed<EChartsOption>(() => ({
  title: {
    text: props.title,
    subtext: props.subtitle,
  },
  legend: {
    data: props.data.map((series) => series.label),
  },
  tooltip: {
    valueFormatter: valueFormatter.value,
  },
  xAxis: {
    type: "time",
    axisLabel: {
      formatter: (timestamp: number) =>
        utcFormat("%a\n%I:%M\n%p")(new Date(timestamp)),
      showMaxLabel: false,
      showMinLabel: false,
    },
  },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: valueFormatter.value,
    },
    max: props.maxValue ?? Y_AXIS_MAX_VALUE,
  },
  series: props.data.map((series, index) => ({
    type: "line",
    name: series.label,
    zlevel: index + 1,
    data: series.data.map((item) => [item.timestamp, item.value]),
  })),
}));
</script>

<style lang="postcss" scoped>
.chart {
  width: 100%;
  height: 30rem;
}
</style>
