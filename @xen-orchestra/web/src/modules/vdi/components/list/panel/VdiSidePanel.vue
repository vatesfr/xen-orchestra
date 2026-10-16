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
      <VdiInfosSidepanelCard :vdi :vbd :from-context />
      <VdiSpaceSidepanelCard :vdi />
      <VdiConfigurationSidepanelCard :vdi :vbd :from-context />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationSidepanelCard.vue'
import VdiInfosSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiInfosSidepanelCard.vue'
import VdiSpaceSidepanelCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceSidepanelCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VdiPageContext } from '@/shared/constants.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { vdi, vm } = defineProps<{
  vdi?: FrontXoVdi
  vm?: FrontXoVm
  fromContext: VdiPageContext
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbds = useGetVbdsByIds(() => vdi?.$VBDs ?? [])

const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm?.id))
</script>
