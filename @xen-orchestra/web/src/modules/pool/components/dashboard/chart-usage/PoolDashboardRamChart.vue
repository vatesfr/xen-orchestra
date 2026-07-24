<template>
  <UiCard :has-error="error">
    <UiCardTitle>
      {{ t('pool-ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="loading || data === null" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="error" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="ramUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsLinearChart v-else :data="ramUsage" :max-value="maxValue" :value-formatter="formatChartBytes" />
  </UiCard>
</template>

<script lang="ts" setup>
import { buildStackedTimeSeries, getHostsStats } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import { formatChartBytes } from '@/shared/utils/chart-stats.util.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import type { XapiPoolStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data, loading } = defineProps<{
  data: XapiPoolStats | null
  loading: boolean
  error?: boolean
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))
const { t } = useI18n()

const ramUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = getHostsStats(data, host => !!host.stats?.memory && !!host.stats?.memoryFree)

  if (hostsStats.length === 0) {
    return []
  }

  const dataLength = hostsStats[0].stats.memory?.length ?? 0

  const ramUsageSeries = buildStackedTimeSeries(hostsStats, dataLength, (host, index) => {
    const memoryTotal = host.stats.memory?.[index] ?? NaN
    const memoryFree = host.stats.memoryFree?.[index] ?? NaN

    return memoryTotal - memoryFree
  })

  return [
    {
      label: t('stacked-ram-usage'),
      data: ramUsageSeries,
    },
  ]
})

const maxValue = computed(() => {
  if (!data) {
    return 1024 * 1024 * 1024 // 1 GB fallback
  }

  const hostsStats = getHostsStats(data, host => !!host.stats?.memory)

  const totalMemory = hostsStats.reduce((sum, host) => {
    const maxMemory = Math.max(...(host.stats.memory?.map(value => value || 0) ?? [0]))

    return sum + maxMemory
  }, 0)

  return totalMemory || 1024 * 1024 * 1024
})
</script>
