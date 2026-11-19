<template>
  <template v-if="hasActions">
    <slot name="title" />
    <template v-if="isHostRunning">
      <HostRebootButton v-if="!exclude.reboot" :host />
      <HostForceRebootButton :host />
      <HostShutdownButton v-if="!exclude.shutdown" :host />
    </template>
    <HostStartButton v-else :host />
  </template>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostForceRebootButton from '@/modules/host/components/actions/reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import type { HostQuickAction } from '@/modules/host/composables/host-quick-actions.composable.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { computed } from 'vue'

const { host, exclude = {} } = defineProps<{
  host: XenApiHost
  exclude?: Partial<Record<HostQuickAction, boolean>>
}>()

defineSlots<{
  title?(): any
}>()

const { isHostRunning: isHostRunningStore } = useHostMetricsStore().subscribe()

const isHostRunning = computed(() => isHostRunningStore(host))

const hasActions = computed(() => isHostRunning.value || !exclude.start)
</script>
