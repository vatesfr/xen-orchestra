<template>
  <VmStartButton :vm />
  <VmPauseButton :vm />
  <VmUnpauseButton :vm />
  <VmResumeButton :vm />
  <VmSuspendButton :vm />
  <VmRebootButton :vm />
  <VmForceRebootButton :vm />
  <VmShutdownButton :vm />
  <VmForceShutdownButton :vm />
</template>

<script lang="ts" setup>
import VmStartButton from '@/modules/vm/components/actions/start/VmStartButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
