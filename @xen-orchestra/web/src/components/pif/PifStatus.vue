<template>
  <VtsConnectionStatus :status="status" />
</template>

<script setup lang="ts">
import type { XoPif } from '@/types/xo/pif.type'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import { computed } from 'vue'

const props = defineProps<{
  pif: XoPif
}>()

const status = computed(() => {
  if (props.pif.attached && props.pif.carrier) {
    return 'connected'
  }
  if (props.pif.attached && !props.pif.carrier) {
    return 'partially-connected'
  }
  return 'disconnected'
})
</script>
