<template>
  <template v-if="isRunning">
    <HostRebootButton :host />
  </template>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { computed } from 'vue'

const { host } = defineProps<{ host: XenApiHost }>()

const { isHostRunning } = useHostMetricsStore().subscribe()

const isRunning = computed(() => isHostRunning(host))
</script>
