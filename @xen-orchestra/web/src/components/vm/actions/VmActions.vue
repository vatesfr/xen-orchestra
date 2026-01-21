<template>
  <VmStartButton :vm />
  <VmStartOnButton :vm />
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
import VmForceRebootButton from '@/components/vm/actions/VmForceRebootButton.vue'
import VmForceShutdownButton from '@/components/vm/actions/VmForceShutdownButton.vue'
import VmPauseButton from '@/components/vm/actions/VmPauseButton.vue'
import VmRebootButton from '@/components/vm/actions/VmRebootButton.vue'
import VmResumeButton from '@/components/vm/actions/VmResumeButton.vue'
import VmShutdownButton from '@/components/vm/actions/VmShutdownButton.vue'
import VmStartButton from '@/components/vm/actions/VmStartButton.vue'
import VmStartOnButton from '@/components/vm/actions/VmStartOnButton.vue'
import VmSuspendButton from '@/components/vm/actions/VmSuspendButton.vue'
import VmUnpauseButton from '@/components/vm/actions/VmUnpauseButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
