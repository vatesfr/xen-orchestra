<template>
  <VtsNoDataHero v-if="topFiveRam === undefined" type="card" />
  <template v-else>
    <UiProgressBar
      v-for="ram in topFiveRam"
      :key="ram.id"
      display-mode="value"
      :value="ram.memory - ram.memoryFree"
      :max="ram.memory"
      :legend="ram.name_label"
    />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  topFiveRam: NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['ram'] | undefined
}>()
</script>
