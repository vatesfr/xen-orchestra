<template>
  <UiProgressBar
    v-for="cpu in vms?.topFiveUsage?.cpu"
    :key="cpu.id"
    display-mode="percent"
    :value="cpu.percent"
    :legend="cpu.name_label"
  />
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  vms: XoPoolDashboard['vms'] | undefined
}>()
</script>
