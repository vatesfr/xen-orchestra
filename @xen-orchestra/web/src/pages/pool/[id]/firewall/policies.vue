<template>
  <VdfPoliciesBoard :scope="{ kind: 'pool', pool }" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfPoliciesBoard from '@/modules/vdf/components/VdfPoliciesBoard.vue'

defineProps<{
  pool: FrontXoPool
}>()
</script>
