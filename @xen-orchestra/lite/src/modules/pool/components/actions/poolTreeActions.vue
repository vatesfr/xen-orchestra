<template>
  <PoolMoreActions :pool />
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types.ts'
import PoolMoreActions from '@/modules/pool/components/actions/PoolMoreActions.vue'

defineProps<{
  pool: XenApiPool
}>()
</script>
