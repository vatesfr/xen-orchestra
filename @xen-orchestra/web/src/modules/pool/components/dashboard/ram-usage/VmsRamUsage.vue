<template>
  <VtsStateHero v-if="topFiveRam === undefined" format="card" type="no-data" size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">
    {{ t('error-no-data') }}
  </VtsStateHero>
  <template v-else>
    <VtsProgressBarGroup :items="progressBarItems" legend-type="bytes-with-total" />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { topFiveRam = [] } = defineProps<{
  topFiveRam: NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['ram'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const progressBarItems = computed(() =>
  topFiveRam.map(
    ram =>
      ({
        id: ram.id,
        label: ram.name_label,
        current: ram.memory - ram.memoryFree,
        total: ram.memory,
      }) satisfies ProgressBarGroupItem
  )
)
</script>
