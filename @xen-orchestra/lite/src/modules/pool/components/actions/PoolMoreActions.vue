<template>
  <PoolDownloadButton :master-host="pool.master" />
</template>

<script setup lang="ts">
import type { XenApiPool } from '@/libs/xen-api/xen-api.types.ts'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'

defineProps<{
  pool: XenApiPool
}>()
</script>
