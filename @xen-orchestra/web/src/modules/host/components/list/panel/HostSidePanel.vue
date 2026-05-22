<template>
  <VtsSidePanel :selected="!!host" :closable="!!host" @close="emit('close')">
    <template #default>
      <VtsStateHero v-if="!host" format="panel" type="no-selection" size="medium" />
      <template v-else>
        <HostInfoCard :host />
        <HostNetworkCard :host />
        <!-- host licensing -->
        <HostSoftwareCard :host />
        <HostHardwareSpecificationsCard :host />
        <!-- host hardware health -->
      </template>
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
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'

defineProps<{
  host?: FrontXoHost
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
