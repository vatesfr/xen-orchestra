<template>
  <UiProgressBar
    v-for="ram in vms?.topFiveUsage?.ram"
    :key="ram.id"
    display-mode="value"
    :value="ram.memory - ram.memoryFree"
    :max="ram.memory"
    :legend="ram.name_label"
  />
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  vms: XoPoolDashboard['vms'] | undefined
}>()
</script>
