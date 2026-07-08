<template>
  <template v-if="server">
    <PoolToggleConnectionButton :server-id="props.serverId" />
    <PoolDownloadButton v-if="resolvedPoolId" :pool-id="resolvedPoolId" />
  </template>
</template>

<script lang="ts" setup>
import PoolToggleConnectionButton from '@/modules/pool/components/actions/connection/PoolConnectionToggleButton.vue'
import PoolDownloadButton from '@/modules/pool/components/actions/download/PoolDownloadButton.vue'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { computed } from 'vue'

const props = defineProps<{
  serverId: FrontXoServer['id']
}>()

const { servers } = useXoServerCollection()

const server = computed(() => servers.value.find(s => s.id === props.serverId))

const resolvedPoolId = computed(() => server.value?.poolId)
</script>
