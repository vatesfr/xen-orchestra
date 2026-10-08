<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vm && vbd" #actions>
      <VbdConnectButton v-if="!vbd.attached" :vbd :vm />
      <VbdDisconnectButton v-else :vbd :vm />
    </template>
    <template v-if="vdi" #more-actions>
      <VdiActions :vdi :vbd :vm />
    </template>
    <template v-if="vdi" #default>
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vm />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import { useVdiVmVbd } from '@/modules/vdi/composables/use-vdi-vm-vbd.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { vdi, vm } = defineProps<{
  vdi?: FrontXoVdi
  vm?: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const vbd = useVdiVmVbd(
  () => vdi,
  () => vm
)
</script>
