<template>
  <UiCardTitle :left="t('hosts')" :level="UiCardTitleLevel.SubtitleWithUnderline" :right="t('top-#', { n: N_ITEMS })" />
  <NoDataError v-if="hasError" />
  <UiCardSpinner v-else-if="isLoading" />
  <NoResult v-else-if="isStatEmpty" />
  <VtsProgressBarGroup v-else :items="data" :n-items="N_ITEMS" legend-type="bytes-with-total" />
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import NoResult from '@/components/NoResult.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useStatStatus } from '@/composables/stat-status.composable'
import { parseRamUsage } from '@/libs/utils'
import { N_ITEMS } from '@/pages/pool/[uuid]/dashboard.vue'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_STATS } from '@/types/injection-keys'
import type { StatData } from '@/types/stat'
import VtsProgressBarGroup from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { hasError, isFetching } = useHostStore().subscribe()

const stats = inject(
  IK_HOST_STATS,
  computed(() => [])
)

const data = computed(() => {
  const result: StatData[] = []

  stats.value.forEach(stat => {
    if (stat.stats == null) {
      return
    }

    const { total, used } = parseRamUsage(stat.stats)
    result.push({
      id: stat.id,
      label: stat.name,
      current: used,
      total,
    })
  })
  return result
})

const { isLoading, isStatEmpty } = useStatStatus(stats, data, isFetching)
</script>
