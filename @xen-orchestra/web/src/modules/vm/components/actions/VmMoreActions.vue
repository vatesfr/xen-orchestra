<template>
  <VmPauseButton :vm />
  <VmSuspendButton :vm />
  <VmRebootButton :vm />
  <VmForceRebootButton :vm />
  <VmShutdownButton :vm />
  <VmForceShutdownButton :vm />
  <VtsDivider type="stretch" />
  <VmSnapshotButton :vm />
  <VmDeleteButton :vm />
</template>

<script lang="ts" setup>
import VmDeleteButton from '@/modules/vm/components/actions/delete/VmDeleteButton.vue'
import VmPauseButton from '@/modules/vm/components/actions/pause/VmPauseButton.vue'
import VmForceRebootButton from '@/modules/vm/components/actions/reboot/VmForceRebootButton.vue'
import VmRebootButton from '@/modules/vm/components/actions/reboot/VmRebootButton.vue'
import VmForceShutdownButton from '@/modules/vm/components/actions/shutdown/VmForceShutdownButton.vue'
import VmShutdownButton from '@/modules/vm/components/actions/shutdown/VmShutdownButton.vue'
import VmSnapshotButton from '@/modules/vm/components/actions/snapshot/VmSnapshotButton.vue'
import VmSuspendButton from '@/modules/vm/components/actions/suspend/VmSuspendButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'

defineProps<{
  vm: FrontXoVm
}>()
</script>
