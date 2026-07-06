<template>
  <template v-if="poolId">
    <PoolDownloadButton :pool-id="poolId" />
    <PoolConnectButton :pool-id="poolId" />
    <PoolDisconnectButton :pool-id="poolId" />
  </template>
</template>

<script setup lang="ts">
import PoolConnectButton from '@/modules/pool/components/actions/connect/PoolConnectButton.vue'
import PoolDisconnectButton from '@/modules/pool/components/actions/disconnect/PoolDisconnectButton.vue'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  poolId: FrontXoPool['id'] | undefined
}>()
</script>
