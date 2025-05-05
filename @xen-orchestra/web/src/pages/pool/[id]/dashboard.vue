<template>
  <div class="host-dashboard">
    <div class="dashboard-row">
      <div><Status :pool /></div>
      <div class="alarms-box"><Alarms /></div>
      <div><Patch /></div>
    </div>
    <div class="dashboard-column">
      <div />
      <div class="ram"><RamUsage :pool /></div>
      <div class="cpu" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Alarms from '@/components/pool/dashboard/PoolDashboardalarms.vue'
import Patch from '@/components/pool/dashboard/PoolDashboardpatch.vue'
import Status from '@/components/pool/dashboard/PoolDashboardstatus.vue'
import RamUsage from '@/components/pool/dashboard/ramUsage.vue'
import type { XoPool } from '@/types/xo/pool.type'

const { pool } = defineProps<{
  pool: XoPool
}>()
</script>

<style scoped lang="postcss">
.dashboard-row {
  display: flex;
  flex-direction: row;
  width: 100%;
  .alarms-box {
    flex-shrink: 1;
  }
}
</style>
