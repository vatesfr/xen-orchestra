<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }" closable @close="emit('close')">
    <template #default>
      <HostInfoCard :host />
      <HostNetworkCard :host />
      <!-- host licensing -->
      <HostSoftwareCard :host />
      <HostHardwareSpecificationsCard :host />
      <!-- host hardware health -->
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import HostHardwareSpecificationsCard from '@/modules/host/components/list/panel/card/HostHardwareSpecificationsCard.vue'
import HostInfoCard from '@/modules/host/components/list/panel/card/HostInfoCard.vue'
import HostNetworkCard from '@/modules/host/components/list/panel/card/HostNetworkCard.vue'
import HostSoftwareCard from '@/modules/host/components/list/panel/card/HostSoftwareCard.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  host: FrontXoHost
}>()

const emit = defineEmits<{
  close: []
}>()

const uiStore = useUiStore()
</script>

<style scoped lang="postcss">
.mobile-drawer {
  position: fixed;
  inset: 0;

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
