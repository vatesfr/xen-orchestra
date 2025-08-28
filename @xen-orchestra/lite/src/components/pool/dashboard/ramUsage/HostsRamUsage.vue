<template>
  <UiCardTitle :left="t('hosts')" :level="UiCardTitleLevel.SubtitleWithUnderline" :right="t('top-#', { n: N_ITEMS })" />
  <VtsStateHero v-if="hasError" format="card" type="error" image-size="medium">{{ t('error-no-data') }}</VtsStateHero>
  <VtsStateHero v-else-if="isLoading" format="card" busy />
  <VtsStateHero v-else-if="isStatEmpty" format="card" type="no-data" image-size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <VtsProgressBarGroup v-else :items="data" :n-items="N_ITEMS" legend-type="bytes-with-total" />
</template>

<script lang="ts" setup>
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { useStatStatus } from '@/composables/stat-status.composable'
import { parseRamUsage } from '@/libs/utils'
import { N_ITEMS } from '@/pages/pool/[uuid]/dashboard.vue'
import { useHostStore } from '@/stores/xen-api/host.store'
import { UiCardTitleLevel } from '@/types/enums'
import { IK_HOST_STATS } from '@/types/injection-keys'
import type { StatData } from '@/types/stat'
import VtsProgressBarGroup from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
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
