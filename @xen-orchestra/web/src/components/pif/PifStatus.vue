<template>
  <VtsConnectionStatus :status />
</template>

<script setup lang="ts">
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import VtsConnectionStatus, { type ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import { computed } from 'vue'

const { network } = defineProps<{
  network: XoNetwork
}>()
const { records: pifs } = usePifStore().subscribe()

const networkPifs = computed(() => pifs.value.filter(pif => network.PIFs.includes(pif.id)))

const status = computed<ConnectionStatus>(() => {
  if (networkPifs.value.length === 0) {
    return 'disconnected'
  }
  if (networkPifs.value.every(pif => pif.attached)) {
    return 'connected'
  }
  if (networkPifs.value.some(pif => pif.attached)) {
    return 'partially-connected'
  }
  return 'disconnected'
})
</script>
