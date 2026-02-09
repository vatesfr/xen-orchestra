<template>
  <PoolDownloadButton :pool-id="pool.id" />
</template>

<script lang="ts" setup>
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import type { XoPool } from '@vates/types'

defineProps<{
  pool: XoPool
}>()
</script>
