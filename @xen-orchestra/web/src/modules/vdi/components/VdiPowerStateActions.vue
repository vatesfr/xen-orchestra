<template>
  <VbdConnectButton v-if="vm && vbd && !attachedVbd" :vm :vbd is-vdi-page />
  <VbdDisconnectButton v-if="vm && vbd && attachedVbd" :vm :vbd is-vdi-page />
</template>

<script lang="ts" setup>
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed } from 'vue'

const { vbd, vm } = defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
}>()

const attachedVbd = computed(() => {
  return vbd && vbd.attached
})
</script>
