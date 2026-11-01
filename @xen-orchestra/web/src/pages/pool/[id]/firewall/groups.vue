<template>
  <VdfGroupsBoard :scope="{ kind: 'pool', pool }" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfGroupsBoard from '@/modules/vdf/components/VdfGroupsBoard.vue'

defineProps<{
  pool: FrontXoPool
}>()
</script>
