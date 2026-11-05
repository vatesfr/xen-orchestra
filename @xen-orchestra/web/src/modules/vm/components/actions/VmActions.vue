<template>
  <VmMoreActions :vm show-change-state />
</template>

<script setup lang="ts">
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()
</script>
