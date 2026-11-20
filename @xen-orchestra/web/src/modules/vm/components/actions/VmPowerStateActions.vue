<template>
  <VmStartButton v-if="!exclude.start" :vm />
  <VmStartOnButton :vm />
  <VmPauseButton :vm />
  <VmUnpauseButton v-if="!exclude.unpause" :vm />
  <VmResumeButton v-if="!exclude.resume" :vm />
  <VmSuspendButton :vm />
  <VmRebootButton v-if="!exclude.reboot" :vm />
  <VmForceRebootButton v-if="!exclude['force-reboot']" :vm />
  <VmShutdownButton v-if="!exclude.shutdown" :vm />
  <VmForceShutdownButton v-if="!exclude['force-shutdown']" :vm />
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
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VmQuickAction } from '@/modules/vm/utils/xo-vm.util.ts'

const { exclude = {} } = defineProps<{
  vm: FrontXoVm
  exclude?: Partial<Record<VmQuickAction, boolean>>
}>()
</script>
