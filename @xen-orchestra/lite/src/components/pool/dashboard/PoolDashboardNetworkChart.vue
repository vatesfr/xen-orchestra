<template>
  <UiCard class="linear-chart" :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ t('network-throughput') }}</UiCardTitle>
    <UiCardTitle :level="UiCardTitleLevel.Subtitle">
      {{ t('last-week') }}
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
import { formatSize } from '@/libs/utils'
import { RRD_STEP_FROM_STRING } from '@/libs/xapi-stats'
import type { HostStats } from '@/libs/xapi-stats'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_LAST_WEEK_STATS } from '@/types/injection-keys'
import type { LinearChartData } from '@core/types/chart'
import { map } from 'lodash-es'
import { computed, defineAsyncComponent, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const hostLastWeekStats = inject(IK_HOST_LAST_WEEK_STATS)
const { hasError, isFetching } = useHostStore().subscribe()

const data = computed<LinearChartData>(() => {
  const stats = hostLastWeekStats?.stats?.value
  const timestampStart = hostLastWeekStats?.timestampStart?.value

  if (timestampStart === undefined || stats == null) {
    return []
  }

  const results = {
    tx: new Map<number, { timestamp: number; value: number }>(),
    rx: new Map<number, { timestamp: number; value: number }>(),
  }

  const addResult = (stats: HostStats, type: 'tx' | 'rx') => {
    const networkStats = Object.values(stats.pifs[type])

    for (let hourIndex = 0; hourIndex < networkStats[0].length; hourIndex++) {
      const timestamp = (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000

      const networkThroughput = networkStats.reduce((total, throughput) => total + throughput[hourIndex], 0)

      results[type].set(timestamp, {
        timestamp,
        value: (results[type].get(timestamp)?.value ?? 0) + networkThroughput,
      })
    }
  }

  stats.forEach(host => {
    if (!host.stats) {
      return
    }

    addResult(host.stats, 'rx')
    addResult(host.stats, 'tx')
  })

  return [
    {
      label: t('network-upload'),
      data: Array.from(results.tx.values()),
    },
    {
      label: t('network-download'),
      data: Array.from(results.rx.values()),
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
    return (
      hostStats != null &&
      Object.values(hostStats.pifs.rx)[0].length + Object.values(hostStats.pifs.tx)[0].length ===
        data.value[0].data.length + data.value[1].data.length
    )
  })
})

const isLoading = computed(() => isFetching.value || !isStatFetched.value)

// TODO: improve the way to get the max value of graph
// See: https://github.com/vatesfr/xen-orchestra/pull/6610/files#r1072237279
const customMaxValue = computed(
  () => Math.max(...map(data.value[0].data, 'value'), ...map(data.value[1].data, 'value')) * 1.5
)

const customValueFormatter = (value: number) => String(formatSize(value))
</script>
