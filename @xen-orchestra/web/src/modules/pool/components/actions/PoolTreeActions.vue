<template>
  <template v-if="poolId">
    <PoolDownloadButton :pool-id="poolId" />
    <PoolToggleConnectionButton :pool-id="poolId" />
  </template>
</template>

<script setup lang="ts">
import PoolToggleConnectionButton from '@/modules/pool/components/actions/connection/PoolConnectionToggleButton.vue'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  poolId: FrontXoPool['id'] | undefined
}>()
</script>
