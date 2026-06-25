<template>
  <VtsSidePanel :has-selection="!!vm" @close="emit('close')">
    <template v-if="vm">
      <VmInfoCard :vm />
      <VmNetworkCard :vm />
      <VmResourcesCard :vm />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  vm?: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
