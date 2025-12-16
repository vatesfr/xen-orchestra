<template>
  <UiCardTitle :left="t('vms')" :level="UiCardTitleLevel.SubtitleWithUnderline" :right="t('top-#', { n: N_ITEMS })" />
  <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
  <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">{{ t('error-no-data') }}</VtsStateHero>
  <VtsStateHero v-else-if="isStatEmpty" format="card" type="no-data" size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <VtsProgressBarGroup v-else :items="data" :n-items="N_ITEMS" legend-type="percent" />
</template>

<script lang="ts" setup>
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useStatStatus } from '@/composables/stat-status.composable'
import { getAvgCpuUsage } from '@/libs/utils'
import { N_ITEMS } from '@/pages/pool/[uuid]/dashboard.vue'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_VM_STATS } from '@/types/injection-keys'
import type { StatData } from '@/types/stat'
import VtsProgressBarGroup from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { hasError, isFetching } = useVmStore().subscribe()

const stats = inject(
  IK_VM_STATS,
  computed(() => [])
)

const data = computed<StatData[]>(() => {
  const result: StatData[] = []

  stats.value.forEach(stat => {
    if (!stat.stats) {
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
