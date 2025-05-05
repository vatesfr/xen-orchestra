<template>
  <div class="host-dashboard">
    <div class="dashboard-row">
      <div><Status :pool /></div>
      <div class="alarms-box"><Alarms /></div>
      <div><Patch /></div>
    </div>
    <div class="dashboard-column">
      <div />
      <div><RamUsage :pool /></div>
      <div />
    </div>
  </div>
</template>

<script setup lang="ts">
import Alarms from '@/components/pool/dashboard/alarms.vue'
import Patch from '@/components/pool/dashboard/patch.vue'
import RamUsage from '@/components/pool/dashboard/ramUsage.vue'
import Status from '@/components/pool/dashboard/status.vue'
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
