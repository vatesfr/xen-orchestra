<template>
  <PoolDownloadButton :pool-id="pool.id" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import PoolDownloadButton from './download/PoolDownloadButton.vue'

defineProps<{
  pool: FrontXoPool
}>()
</script>
