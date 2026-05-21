<template>
  <VtsSidePanel :selected="!!vdi" :closable="!!vdi" @close="emit('close')">
    <template v-if="vbd" #actions>
      <VbdConnectButton v-if="!vbd.attached" :vbd :vm />
      <VbdDisconnectButton v-else :vbd :vm />
    </template>
    <template v-if="vdi" #more-actions>
      <VdiActions :vdi :vbd :vm />
    </template>
    <template #default>
      <VtsStateHero v-if="!vdi" format="panel" type="no-selection" size="medium" />
      <template v-else>
        <VdiInfosCard :vdi :vm />
        <VdiSpaceCard :vdi />
        <VdiConfigurationCard :vdi :vm />
      </template>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'

const { vdi, vm } = defineProps<{
  vdi?: FrontXoVdi
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbds = useGetVbdsByIds(vdi?.$VBDs ?? [])

const vbd = computed(() => vbds.value.find(vbd => vbd.VM === vm.id))
</script>
