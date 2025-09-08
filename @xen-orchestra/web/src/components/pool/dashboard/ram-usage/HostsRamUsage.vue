<template>
  <VtsNoDataHero v-if="topFiveRam === undefined" type="card" />
  <template v-else>
    <VtsProgressBarGroup :items="progressBarItems" legend-type="bytes-with-total" />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import { computed } from 'vue'

const { topFiveRam = [] } = defineProps<{
  topFiveRam: NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['ram'] | undefined
}>()

const progressBarItems = computed(() =>
  topFiveRam.map(
    ram =>
      ({
        id: ram.id,
        label: ram.name_label,
        current: ram.usage,
        total: ram.size,
      }) satisfies ProgressBarGroupItem
  )
)
</script>
