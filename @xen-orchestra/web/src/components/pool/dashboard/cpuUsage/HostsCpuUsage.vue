<template>
  <UiProgressBar
    v-for="cpu in hosts?.topFiveUsage?.cpu"
    :key="cpu.id"
    class="progressBar"
    :value="cpu.percent"
    :legend="cpu.name_label"
  />
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  hosts: XoPoolDashboard['hosts'] | undefined
}>()
</script>
