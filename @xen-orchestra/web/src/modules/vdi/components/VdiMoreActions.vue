<template>
  <VdiDetachButton :vm :vbd />
  <VdiDeleteButton :vdi :vm />
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiDetachButton from '@/modules/vdi/components/actions/detach/VdiDetachButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm?: FrontXoVm
  vbd?: FrontXoVbd
  vdi: FrontXoVdi
}>()
</script>
