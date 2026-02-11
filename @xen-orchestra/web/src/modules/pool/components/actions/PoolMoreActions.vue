<template>
  <PoolDownloadButton :pool-id="pool.id" />
</template>

<script lang="ts" setup>
import type { XoPool } from '@vates/types'
import PoolDownloadButton from './download/PoolDownloadButton.vue'

defineProps<{
  pool: XoPool
}>()
</script>
