<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('network-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
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
import { buildVmNetworkUsageSeries, getVmNetworkUsageMaxValue } from '@/modules/vm/utils/xo-vm-dashboard.util.ts'
import { formatChartBytes } from '@/shared/utils/chart-stats.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiVmStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: XapiVmStats | null
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const networkUsageSeries = computed(() => buildVmNetworkUsageSeries(data))

const networkUsage = computed<LinearChartData>(() => {
  const { download, upload } = networkUsageSeries.value

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

const maxValue = computed(() => getVmNetworkUsageMaxValue(networkUsageSeries.value))
</script>
