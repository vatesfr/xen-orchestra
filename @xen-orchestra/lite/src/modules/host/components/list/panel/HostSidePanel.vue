<template>
  <VtsSidePanel :has-selection="!!host" @close="emit('close')">
    <template v-if="host" #default>
      <HostInfosCard :host />
      <HostSrsCard :host />
      <HostNetworkCard :host />
      <HostSoftwareCard :host />
      <HostHardwareSpecificationsCard :host />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostHardwareSpecificationsCard from '@/modules/host/components/list/panel/cards/HostHardwareSpecificationsCard.vue'
import HostInfosCard from '@/modules/host/components/list/panel/cards/HostInfosCard.vue'
import HostNetworkCard from '@/modules/host/components/list/panel/cards/HostNetworkCard.vue'
import HostSoftwareCard from '@/modules/host/components/list/panel/cards/HostSoftwareCard.vue'
import HostSrsCard from '@/modules/host/components/list/panel/cards/HostSrsCard.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  host?: XenApiHost
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
