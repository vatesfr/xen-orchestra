<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }" closable @close="emit('close')">
    <template #default>
      <VmInfoCard :vm />
      <VmNetworkCard :vm />
      <VmResourcesCard :vm />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'

defineProps<{
  vm: FrontXoVm
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
