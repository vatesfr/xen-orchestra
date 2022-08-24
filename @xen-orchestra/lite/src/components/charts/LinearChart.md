# LinearChart component

```vue
<template>
  <LinearChart
    title="Chart title"
    subtitle="Chart subtitle"
    :data="data"
    :value-formatter="customValueFormatter"
  />
</template>

<script lang="ts" setup>
import type { LinearChartData } from "@/types/chart";
import LinearChart from "@/components/charts/LinearChart.vue";

const data: LinearChartData = [
  {
    label: "First series",
    data: [
      { date: "...", value: 1234 },
      { date: "...", value: 1234 },
    ],
  },
  {
    label: "Second series",
    data: [
      { date: "...", value: 1234 },
      { date: "...", value: 1234 },
    ],
  },
];

const customValueFormatter = (value: number) => {
  return `${value} (Doubled: ${value * 2})`;
};
</script>
```
