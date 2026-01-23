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
import VmPauseButton from '@/modules/vm/components/actions/pause/VmPauseButton.vue'
import VmForceRebootButton from '@/modules/vm/components/actions/reboot/VmForceRebootButton.vue'
import VmRebootButton from '@/modules/vm/components/actions/reboot/VmRebootButton.vue'
import VmResumeButton from '@/modules/vm/components/actions/resume/VmResumeButton.vue'
import VmForceShutdownButton from '@/modules/vm/components/actions/shutdown/VmForceShutdownButton.vue'
import VmShutdownButton from '@/modules/vm/components/actions/shutdown/VmShutdownButton.vue'
import VmStartButton from '@/modules/vm/components/actions/start/VmStartButton.vue'
import VmStartOnButton from '@/modules/vm/components/actions/start/VmStartOnButton.vue'
import VmSuspendButton from '@/modules/vm/components/actions/suspend/VmSuspendButton.vue'
import VmUnpauseButton from '@/modules/vm/components/actions/unpause/VmUnpauseButton.vue'
import type { XoVm } from '@vates/types'

defineProps<{
  vm: XoVm
}>()
</script>
