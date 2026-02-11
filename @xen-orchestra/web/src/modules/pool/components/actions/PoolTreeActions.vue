<template>
  <PoolMoreActions :pool />
</template>

<script setup lang="ts">
import PoolMoreActions from '@/modules/pool/components/actions/PoolMoreActions.vue'
import type { XoPool } from '@vates/types'

defineProps<{
  pool: XoPool
}>()
</script>
