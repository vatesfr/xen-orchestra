<template>
  <div class="pool-dashboard">
    <div class="dashboard-row">
      <div><PoolDashboardstatus :pool /></div>
      <div class="alarms-box"><Alarms /></div>
      <div><Patch /></div>
    </div>
    <div class="dashboard-column">
      <div class="storage"><PoolDashboardStorageUsage :pool-id="pool.id" /></div>
      <div class="ram"><PoolDashboardRamUsage :pool /></div>
      <div class="cpu">
        <PoolDashboardCpuProvisioning :pool />
        <PoolDashboardCpuUsage :pool />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Alarms from '@/components/pool/dashboard/PoolDashboardalarms.vue'
import PoolDashboardCpuProvisioning from '@/components/pool/dashboard/PoolDashboardCpuProvisioning.vue'
import PoolDashboardCpuUsage from '@/components/pool/dashboard/PoolDashboardCpuUsage.vue'
import Patch from '@/components/pool/dashboard/PoolDashboardpatch.vue'
import PoolDashboardRamUsage from '@/components/pool/dashboard/PoolDashboardRamUsage.vue'
import PoolDashboardstatus from '@/components/pool/dashboard/PoolDashboardstatus.vue'
import PoolDashboardStorageUsage from '@/components/pool/dashboard/PoolDashboardStorageUsage.vue'
import type { XoPool } from '@/types/xo/pool.type'

const { pool } = defineProps<{
  pool: XoPool
}>()
</script>

<style scoped lang="postcss">
.pool-dashboard {
  .dashboard-row {
    padding: 0.8rem;
    display: flex;
    flex-direction: row;
    gap: 0.8rem;

    .alarms-box {
      flex-shrink: 1;
    }
  }

  .dashboard-column {
    display: flex;
    gap: 0.8rem;
    padding: 0 0.8rem;

    div {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .storage,
    .ram,
    .cpu {
      width: calc(100% / 3);
    }
  }
}
</style>
