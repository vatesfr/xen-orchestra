<template>
  <UiCardTitle :left="t('hosts')" :level="UiCardTitleLevel.SubtitleWithUnderline" :right="t('top-#', { n: N_ITEMS })" />
  <NoDataError v-if="hasError" />
  <VtsStateHero v-if="isLoading" format="card" busy />
  <NoResult v-else-if="isStatEmpty" />
  <VtsProgressBarGroup v-else :items="data" :n-items="N_ITEMS" legend-type="percent" />
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import NoResult from '@/components/NoResult.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useStatStatus } from '@/composables/stat-status.composable'
import { getAvgCpuUsage } from '@/libs/utils'
import { N_ITEMS } from '@/pages/pool/[uuid]/dashboard.vue'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_STATS } from '@/types/injection-keys'
import type { StatData } from '@/types/stat'
import VtsProgressBarGroup from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { hasError, isFetching } = useHostStore().subscribe()

const { t } = useI18n()

const stats = inject(
  IK_HOST_STATS,
  computed(() => [])
)

const data = computed<StatData[]>(() => {
  const result: StatData[] = []

  stats.value.forEach(stat => {
    if (stat.stats == null) {
      return
    }

    const avgCpuUsage = getAvgCpuUsage(stat.stats.cpus)

    if (avgCpuUsage === undefined) {
      return
    }

    result.push({
      id: stat.id,
      label: stat.name,
      current: avgCpuUsage,
      total: 100,
    })
  })

  return result
})

const { isLoading, isStatEmpty } = useStatStatus(stats, data, isFetching)
</script>
