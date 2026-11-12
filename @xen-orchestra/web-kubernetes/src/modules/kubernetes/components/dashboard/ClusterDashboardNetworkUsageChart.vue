<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <UiInfo v-if="excludedNodeCount > 0" accent="warning">{{ t('n-nodes-excluded', excludedNodeCount) }}</UiInfo>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="networkUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="networkUsage" :max-value :value-formatter="formatChartBytes" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildClusterNetworkUsageSeries } from '@/modules/kubernetes/utils/kubernetes-cluster-stats.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import type { XapiVmStats } from '@vates/types/common'
import { formatChartBytes, getPairedUsageMaxValue } from '@xen-orchestra/web/ui-plugin-sdk'
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

const networkUsageSeries = computed(() => buildClusterNetworkUsageSeries(data))

const networkUsage = computed<LinearChartData>(() => {
  const [download, upload] = networkUsageSeries.value

  if (download.length === 0 && upload.length === 0) {
    return []
  }

  return [
    {
      label: t('network-upload'),
      data: upload,
    },
    {
      label: t('network-download'),
      data: download,
    },
  ]
})

const maxValue = computed(() => getPairedUsageMaxValue(networkUsageSeries.value, { step: 50 }))
</script>
