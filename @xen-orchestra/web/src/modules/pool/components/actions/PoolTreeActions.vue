<template>
  <PoolNewVmButton :pool-id="pool.id" />
  <PoolDisconnectButton :pool-id="pool.id" :pool-name="pool.name_label" />
  <PoolDownloadButton :pool-id="pool.id" />
</template>

<script setup lang="ts">
import PoolDisconnectButton from '@/modules/pool/components/actions/disconnect/PoolDisconnectButton.vue'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import PoolNewVmButton from '@/modules/pool/components/actions/new-vm/PoolNewVmButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

defineProps<{
  pool: FrontXoPool
}>()
</script>
