<template>
  <VtsSidePanel :has-selection="!!host" @close="emit('close')">
    <template v-if="host">
      <HostInfoCard :host />
      <HostNetworkCard :host />
      <!-- host licensing -->
      <HostSoftwareCard :host />
      <HostHardwareSpecificationsCard :host />
      <!-- host hardware health -->
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import HostHardwareSpecificationsCard from '@/modules/host/components/list/panel/card/HostHardwareSpecificationsCard.vue'
import HostInfoCard from '@/modules/host/components/list/panel/card/HostInfoCard.vue'
import HostNetworkCard from '@/modules/host/components/list/panel/card/HostNetworkCard.vue'
import HostSoftwareCard from '@/modules/host/components/list/panel/card/HostSoftwareCard.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  host?: FrontXoHost
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
