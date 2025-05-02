<template>
  <div class="host-dashboard">
    <div class="dashboard-row">
      <div><Status :pool /></div>
      <div />
      <div />
    </div>
    <div class="dashboard-column">
      <div />
      <div />
      <div />
    </div>
  </div>
</template>

<script setup lang="ts">
import Status from '@/components/pool/dashboard/status.vue'
import type { XoPool } from '@/types/xo/pool.type'

const { pool } = defineProps<{
  pool: XoPool
}>()
</script>
