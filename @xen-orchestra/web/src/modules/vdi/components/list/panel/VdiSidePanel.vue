<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vdi" #actions>
      <template v-if="vbd">
        <VbdConnectButton v-if="!vbd.attached" :vbd :vm />
        <VbdDisconnectButton v-else :vbd :vm />
      </template>
      <VdiMigrateButton :vdi />
      <VbdDeleteButton v-if="vbd" :vbd :vm />
      <VdiDeleteButton :vdi :vm />
    </template>
    <template v-if="vdi" #more-actions>
      <VdiImportExportMenu :vdi />
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
import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiImportExportMenu from '@/modules/vdi/components/actions/import-export/VdiImportExportMenu.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { vdi, vm } = defineProps<{
  vdi?: FrontXoVdi
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbds = useGetVbdsByIds(() => vdi?.$VBDs ?? [])

const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))
</script>
