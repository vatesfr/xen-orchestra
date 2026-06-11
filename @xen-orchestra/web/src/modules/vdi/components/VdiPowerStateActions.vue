<template>
  <VdiConnectButton :vm :vbd />
  <VbdConnectButton v-if="vm && vbd" :vm :vbd />
  <VdiDisconnectButton :vm :vbd />
  <VbdDisconnectButton v-if="vm && vbd" :vm :vbd />
</template>

<script lang="ts" setup>
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConnectButton from '@/modules/vdi/components/actions/connect/VdiConnectButton.vue'
import VdiDisconnectButton from '@/modules/vdi/components/actions/disconnect/VdiDisconnectButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
}>()
</script>
