<template>
  <VtsNoDataHero v-if="topFiveCpu === undefined" type="card" />
  <template v-else>
    <UiProgressBar
      v-for="cpu in topFiveCpu"
      :key="cpu.id"
      display-mode="percent"
      :value="cpu.percent"
      :legend="cpu.name_label"
    />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  topFiveCpu: NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['cpu'] | undefined
}>()
</script>
