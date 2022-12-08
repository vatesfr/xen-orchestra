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

const props = defineProps<{
  title?: string;
  subtitle?: string;
  data: LinearChartData;
  valueFormatter?: (value: number) => string;
}>();

const valueFormatter = (value: OptionDataValue | OptionDataValue[]) => {
  if (props.valueFormatter) {
    return props.valueFormatter(value as number);
  }

  return value.toString();
};

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
    valueFormatter,
  },
  xAxis: {
    type: "time",
    axisLabel: {
      formatter: (date: number) => {
        return utcFormat("%a %I:%M %p")(new Date(date));
      },
      margin: 10,
      padding: [10, 10, 10, 10],
      showMaxLabel: false,
      showMinLabel: false,
    },
  },
  yAxis: {
    type: "value",
    axisLabel: {
      formatter: valueFormatter,
    },
  },
  series: props.data.map((series, index) => ({
    type: "line",
    name: series.label,
    zlevel: index + 1,
    data: series.data.map((item) => [item.date, item.value]),
  })),
}));
</script>

<style lang="postcss" scoped>
.chart {
  width: 65rem;
  height: 30rem;
}
</style>
