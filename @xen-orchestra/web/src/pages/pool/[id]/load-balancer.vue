<template>
  <LoadBalancerDashboard :key="pool.id" :pool />
</template>

<script lang="ts" setup>
import LoadBalancerDashboard from '@/modules/load-balancer/components/LoadBalancerDashboard.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  pool: FrontXoPool
}>()
</script>
