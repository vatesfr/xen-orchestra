<template>
  <VmSnapshotButton :vm />
  <VmDuplicateButton :vm />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmDuplicateButton from '@/modules/vm/components/actions/duplicate/VmDuplicateButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm: FrontXoVm
}>()
</script>
