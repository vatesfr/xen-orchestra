<template>
  <UiCard>
    <UiCardTitle>
      {{ t('pool-ram-usage') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading || data === null" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsNoDataHero v-else-if="ramUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="ramUsage" :max-value="maxValue" :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data, loading, error } = defineProps<{
  data: XapiPoolStats | null
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))
const { t } = useI18n()

const ramUsage = computed<LinearChartData>(() => {
  if (!data) {
    return []
  }

  const hostsStats = Object.values(data).filter(
    (host): host is XapiHostStats =>
      !!(host as XapiHostStats)?.stats?.memory && !!(host as XapiHostStats)?.stats?.memoryFree
  )

  if (hostsStats.length === 0) {
    return []
  }

  const result = new Map<number, { timestamp: number; value: number }>()
  const firstHost = hostsStats[0]
  const dataLength = firstHost.stats.memory?.length ?? 0
  const timestampStart = firstHost.endTimestamp - firstHost.interval * (dataLength - 1)

  for (let index = 0; index < dataLength; index++) {
    const timestamp = (timestampStart + index * firstHost.interval) * 1000
    const totalUsed = hostsStats.reduce((sum, host) => {
      const memoryTotal = host.stats.memory?.[index] ?? NaN
      const memoryFree = host.stats.memoryFree?.[index] ?? NaN
      const memoryUsed = memoryTotal - memoryFree
      return sum + memoryUsed
    }, 0)

    result.set(timestamp, {
      timestamp,
      value: totalUsed,
    })
  }

  return [
    {
      label: t('stacked-ram-usage'),
      data: Array.from(result.values()),
    },
  ]
})

const maxValue = computed(() => {
  if (!data) {
    return 1024 * 1024 * 1024 // 1 GB fallback
  }

  const hostsStats = Object.values(data).filter(
    (host): host is XapiHostStats => !!(host as XapiHostStats)?.stats?.memory
  )

  const totalMemory = hostsStats.reduce((sum, host) => {
    const maxMemory = Math.max(...(host.stats.memory?.map(value => value || 0) ?? [0]))
    return sum + maxMemory
  }, 0)

  return totalMemory || 1024 * 1024 * 1024
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
</script>
