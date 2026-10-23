<template>
  <UiPanelCard class="task-read-speed-card">
    <UiPanelCardTitle size="medium" :label="t('reading-speed')" />
    <VtsLinearChart :data="chartData" :max-value :value-formatter="formatChartSpeed" />
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { getSpeedSeries, type MetricSample } from '@/modules/task/utils/task-metric.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

// cumulative bytes read, consolidated over the task and its subtasks
const { samples } = defineProps<{
  samples: MetricSample[]
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const speedSeries = computed(() => getSpeedSeries(samples))

const chartData = computed<LinearChartData>(() => [{ label: t('reading-speed'), data: speedSeries.value }])

// some headroom above the highest speed
const maxValue = computed(() => Math.max(1, ...speedSeries.value.map(({ value }) => value)) * 1.1)

function formatChartSpeed(value: number | null): string {
  return value === null ? '' : formatSpeed(value)
}
</script>
