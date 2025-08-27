<template>
  <VtsStateHero v-if="topFiveCpu === undefined" format="card" type="no-data" image-size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <template v-else>
    <VtsProgressBarGroup :items="progressBarItems" :thresholds="cpuProgressThresholds()" legend-type="percent" />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { topFiveCpu = [] } = defineProps<{
  topFiveCpu: NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['cpu'] | undefined
}>()

const progressBarItems = computed(() =>
  topFiveCpu.map(
    cpu =>
      ({
        id: cpu.id,
        label: cpu.name_label,
        current: cpu.percent,
        total: 100,
      }) satisfies ProgressBarGroupItem
  )
)

const { t } = useI18n()
</script>
