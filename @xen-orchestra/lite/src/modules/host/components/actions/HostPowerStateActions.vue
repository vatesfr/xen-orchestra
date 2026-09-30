<template>
  <template v-if="isHostRunning">
    <HostRebootButton :host />
    <HostForceRebootButton :host />
    <HostShutdownButton :host />
  </template>
  <HostStartButton v-else :host />
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostForceRebootButton from '@/modules/host/components/actions/reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { computed } from 'vue'

const { host } = defineProps<{ host: XenApiHost }>()

const { isHostRunning: isHostRunningStore } = useHostMetricsStore().subscribe()

const isHostRunning = computed(() => isHostRunningStore(host))
</script>
