<template>
  <PoolMoreActions :pool />
</template>

<script setup lang="ts">
import PoolMoreActions from '@/modules/pool/components/actions/PoolMoreActions.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  pool: FrontXoPool
}>()
</script>
