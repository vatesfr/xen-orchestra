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
      <div class="cpu">
        <PoolDashboardCpu :pool />
        <RamUsage :pool />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Alarms from '@/components/pool/dashboard/PoolDashboardalarms.vue'
import PoolDashboardCpu from '@/components/pool/dashboard/PoolDashboardCpu.vue'
import Patch from '@/components/pool/dashboard/PoolDashboardpatch.vue'
import RamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import Status from '@/components/pool/dashboard/PoolDashboardstatus.vue'
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

.dashboard-column {
  display: flex;
}
</style>
