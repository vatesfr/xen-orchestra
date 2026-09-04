<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">{{ t('error-no-data') }}</VtsStateHero>
    <VtsStateHero v-else-if="cpuUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="cpuUsage" :max-value :value-formatter class="chart" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildHostCpuUsageSeries, getHostCpuUsageMaxValue } from '@/modules/host/utils/xo-host-dashboard.util.ts'
import type { LinearChartData, ValueFormatter } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiHostStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiHostStats | null
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t, n } = useI18n()

const cpuUsageSeries = computed(() => buildHostCpuUsageSeries(data))

const cpuUsage = computed<LinearChartData>(() => {
  if (cpuUsageSeries.value.length === 0) {
    return []
  }

  return [
    {
      label: t('stacked-cpu-usage'),
      data: cpuUsageSeries.value,
    },
  ]
})

const maxValue = computed(() => getHostCpuUsageMaxValue(cpuUsageSeries.value))

const valueFormatter: ValueFormatter = value => {
  if (value === null) {
    return ''
  }

  return n(value / 100, 'percent')
}
</script>
