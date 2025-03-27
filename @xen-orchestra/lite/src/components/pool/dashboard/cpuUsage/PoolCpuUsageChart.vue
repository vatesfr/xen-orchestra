<template>
  <UiCard :color="hasError ? 'error' : undefined" class="linear-chart">
    <UiCardTitle>{{ $t('pool-cpu-usage') }}</UiCardTitle>
    <UiCardTitle :level="UiCardTitleLevel.Subtitle">
      {{ $t('last-week') }}
    </UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="isLoading" />
    <VtsLinearChart v-else :data :max-value="customMaxValue" :value-formatter="customValueFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import type { HostStats } from '@/libs/xapi-stats'
import { RRD_STEP_FROM_STRING } from '@/libs/xapi-stats'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_LAST_WEEK_STATS } from '@/types/injection-keys'
import type { LinearChartData, ValueFormatter } from '@core/types/chart'
import { sumBy } from 'lodash-es'
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t, n } = useI18n()

const hostLastWeekStats = inject(IK_HOST_LAST_WEEK_STATS)

const { records: hosts, isFetching, hasError } = useHostStore().subscribe()
const customMaxValue = computed(() => 100 * sumBy(hosts.value, host => +host.cpu_info.cpu_count))

const data = computed<LinearChartData>(() => {
  const timestampStart = hostLastWeekStats?.timestampStart?.value
  const stats = hostLastWeekStats?.stats?.value

  if (timestampStart === undefined || stats == null) {
    return []
  }

  const result = new Map<number, { timestamp: number; value: number }>()

  const addResult = (stats: HostStats) => {
    const cpus = Object.values(stats.cpus)

    for (let hourIndex = 0; hourIndex < cpus[0].length; hourIndex++) {
      const timestamp = (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000

      const cpuUsageSum = cpus.reduce((total, cpu) => total + cpu[hourIndex], 0)

      result.set(timestamp, {
        timestamp,
        value: Math.round((result.get(timestamp)?.value ?? 0) + cpuUsageSum),
      })
    }
  }

  stats.forEach(host => {
    if (!host.stats) {
      return
    }

    addResult(host.stats)
  })

  return [
    {
      label: t('stacked-cpu-usage'),
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
    return hostStats != null && Object.values(hostStats.cpus)[0].length === data.value[0].data.length
  })
})

const isLoading = computed(() => isFetching.value || !isStatFetched.value)

const customValueFormatter: ValueFormatter = value => n(value / 100, 'percent')
</script>
