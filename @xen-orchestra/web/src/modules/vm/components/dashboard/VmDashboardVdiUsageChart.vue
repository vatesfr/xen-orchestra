<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('vdi-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="vdiUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="vdiUsage" :max-value :value-formatter="formatChartBytes" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildVmVdiUsageSeries, getVmVdiUsageMaxValue } from '@/modules/vm/utils/xo-vm-dashboard.util.ts'
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

const vdiUsageSeries = computed(() => buildVmVdiUsageSeries(data))

const vdiUsage = computed<LinearChartData>(() => {
  const { read, write } = vdiUsageSeries.value

  if (read.length === 0 && write.length === 0) {
    return []
  }

  return [
    {
      label: t('read'),
      data: read,
    },
    {
      label: t('write'),
      data: write,
    },
  ]
})

const maxValue = computed(() => getVmVdiUsageMaxValue(vdiUsageSeries.value))
</script>
