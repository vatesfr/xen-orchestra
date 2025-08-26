<template>
  <VtsNoDataHero v-if="topFiveCpu === undefined" type="card" />
  <template v-else>
    <VtsProgressBarGroup :items="progressBarItems" :thresholds="cpuProgressThresholds()" legend-type="percent" />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { computed } from 'vue'

const { topFiveCpu = [] } = defineProps<{
  topFiveCpu: NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['cpu'] | undefined
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
</script>
