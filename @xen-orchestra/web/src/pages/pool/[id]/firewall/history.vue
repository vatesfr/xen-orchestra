<template>
  <VdfHistoryCard :scope="{ kind: 'pool', pool }" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfHistoryCard from '@/modules/vdf/components/history/VdfHistoryCard.vue'

defineProps<{
  pool: FrontXoPool
}>()
</script>
