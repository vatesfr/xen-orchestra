<template>
  <VmSnapshotButton :vm />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm: FrontXoVm
}>()
</script>
