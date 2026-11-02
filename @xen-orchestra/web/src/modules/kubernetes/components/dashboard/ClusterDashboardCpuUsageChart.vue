<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('cpu-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <UiInfo v-if="excludedNodeCount > 0" accent="warning">{{ t('n-nodes-excluded', excludedNodeCount) }}</UiInfo>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="cpuUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="cpuUsage" :max-value :value-formatter />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildClusterCpuUsageSeries } from '@/modules/kubernetes/utils/kubernetes-cluster-stats.util.ts'
import { useChartPercentFormatter } from '@/shared/composables/chart-percent-formatter.composable.ts'
import { getChartMaxValue } from '@/shared/utils/chart-stats.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import type { XapiVmStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiVmStats[]
  excludedNodeCount: number
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const valueFormatter = useChartPercentFormatter()

const cpuUsageSeries = computed(() => buildClusterCpuUsageSeries(data))

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

const maxValue = computed(() => getChartMaxValue(cpuUsageSeries.value, { step: 100, fallback: 100, headroom: 1.2 }))
</script>
