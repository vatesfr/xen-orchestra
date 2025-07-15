<template>
  <UiProgressBar
    v-for="ram in hosts?.topFiveUsage?.ram"
    :key="ram.id"
    class="progressBar"
    :value="ram.usage"
    :max="ram.size"
    :legend="ram.name_label"
  />
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

defineProps<{
  hosts: XoPoolDashboard['hosts'] | undefined
}>()
</script>
