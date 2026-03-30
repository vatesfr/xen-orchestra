<template>
  <PoolDownloadButton :pool-id="pool.id" />
</template>

<script setup lang="ts">
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  pool: FrontXoPool
}>()
</script>
