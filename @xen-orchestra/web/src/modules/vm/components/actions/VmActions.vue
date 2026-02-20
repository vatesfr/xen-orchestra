<template>
  <VmStartButton :vm />
</template>

<script lang="ts" setup>
import VmStartButton from '@/modules/vm/components/actions/start/VmStartButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm: FrontXoVm
}>()
</script>
