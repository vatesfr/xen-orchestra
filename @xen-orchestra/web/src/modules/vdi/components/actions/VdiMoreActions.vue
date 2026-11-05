<template>
  <VbdDeleteButton v-if="vbd && vm" :vbd :vm />
  <VdiDeleteButton :vdi :vm />
</template>

<script lang="ts" setup>
import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.js'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'

defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
  vdi: FrontXoVdi
}>()
</script>
