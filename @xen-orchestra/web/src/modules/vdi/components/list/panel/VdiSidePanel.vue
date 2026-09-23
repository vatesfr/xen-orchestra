<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vbd && vm" #actions>
      <VbdConnectButton v-if="!vbd.attached" :vbd :vm />
      <VbdDisconnectButton v-else :vbd :vm />
    </template>
    <template v-if="actionableVdi" #more-actions>
      <VdiActions :vdi="actionableVdi" :vm :vbd />
    </template>
    <template v-if="vdi" #default>
      <VdiInfosCard :vdi :vm :vbd :sr-scope />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vbd :sr-scope />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import { useVmVbd } from '@/modules/vbd/composables/use-vm-vbd.composable.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { isVdiSnapshot } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { vdi, vm } = defineProps<{
  vdi?: FrontXoVdi | FrontXoVdiSnapshot
  vm?: FrontXoVm
  srScope?: SrScope
}>()

const emit = defineEmits<{
  close: []
}>()

// VDI snapshots can't be migrated, exported or deleted through the VDI jobs
const actionableVdi = computed(() => (vdi !== undefined && !isVdiSnapshot(vdi) ? vdi : undefined))

const vbd = useVmVbd(
  () => vdi?.$VBDs ?? [],
  () => vm
)
</script>
