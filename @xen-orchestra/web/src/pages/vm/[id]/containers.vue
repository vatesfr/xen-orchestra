<template>
  <DockerTab :vm />
</template>

<script lang="ts" setup>
import DockerTab from '@/modules/docker/components/DockerTab.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

defineProps<{
  vm: FrontXoVm
}>()
</script>
