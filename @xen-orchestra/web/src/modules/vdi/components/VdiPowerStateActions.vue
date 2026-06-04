<template>
  <VdiConnectButton :vm :vbd />
  <VdiDisconnectButton :vm :vbd />
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiConnectButton from '@/modules/vdi/components/actions/connect/VdiConnectButton.vue'
import VdiDisconnectButton from '@/modules/vdi/components/actions/disconnect/VdiDisconnectButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm: FrontXoVm
  vbd: FrontXoVbd
}>()
</script>
