<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template v-if="vdi" #more-actions>
      <VmVdiActions v-if="vm" :vdi :vm />
      <VdiActions v-else :vdi />
    </template>
    <template v-if="vdi" #default>
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vm />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VmVdiActions from '@/modules/vdi/components/actions/VmVdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
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
</script>
