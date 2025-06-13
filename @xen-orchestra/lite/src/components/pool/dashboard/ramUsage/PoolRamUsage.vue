<template>
  <UiCard :color="hasError ? 'error' : undefined" class="linear-chart">
    <UiCardTitle>{{ t('pool-ram-usage') }}</UiCardTitle>
    <UiCardTitle :level="UiCardTitleLevel.Subtitle">
      {{ t('last-week') }}
    </UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="isLoading" />
    <VtsLinearChart v-else :data :max-value="customMaxValue" :value-formatter="customValueFormatter" />
    <SizeStatsSummary :size="currentData.size" :usage="currentData.usage" />
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import SizeStatsSummary from '@/components/ui/SizeStatsSummary.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { formatSize } from '@/libs/utils'
import { RRD_STEP_FROM_STRING } from '@/libs/xapi-stats'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_LAST_WEEK_STATS } from '@/types/injection-keys'
import type { LinearChartData } from '@core/types/chart'
import { sumBy } from 'lodash-es'
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { runningHosts, isFetching, hasError } = useHostStore().subscribe()
const { getHostMemory } = useHostMetricsStore().subscribe()

const { t } = useI18n()

const hostLastWeekStats = inject(IK_HOST_LAST_WEEK_STATS)

const customMaxValue = computed(() => sumBy(runningHosts.value, host => getHostMemory(host)?.size ?? 0))

const currentData = computed(() => {
  let size = 0
  let usage = 0
  runningHosts.value.forEach(host => {
    const hostMemory = getHostMemory(host)
    size += hostMemory?.size ?? 0
    usage += hostMemory?.usage ?? 0
  })
  return { size, usage }
})

const data = computed<LinearChartData>(() => {
  const timestampStart = hostLastWeekStats?.timestampStart?.value
  const stats = hostLastWeekStats?.stats?.value

  if (timestampStart === undefined || stats == null) {
    return []
  }

  const result = new Map<number, { timestamp: number; value: number }>()

  stats.forEach(({ stats }) => {
    if (stats?.memory === undefined) {
      return
    }

    const memoryFree = stats.memoryFree
    const memoryUsage = stats.memory.map((memory, index) => memory - memoryFree[index])

    memoryUsage.forEach((value, hourIndex) => {
      const timestamp = (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000

      result.set(timestamp, {
        timestamp,
        value: (result.get(timestamp)?.value ?? 0) + memoryUsage[hourIndex],
      })
    })
  })

  return [
    {
      label: t('stacked-ram-usage'),
      data: Array.from(result.values()),
    },
  ]
})

const isStatFetched = computed(() => {
  const stats = hostLastWeekStats?.stats?.value
  if (stats === undefined) {
    return false
  }

  return stats.every(host => {
    const hostStats = host.stats
    return hostStats != null && hostStats.memory.length === data.value[0].data.length
  })
})

const isLoading = computed(() => (isFetching.value && !hasError.value) || !isStatFetched.value)

const customValueFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  return formatSize(value)
}
</script>
