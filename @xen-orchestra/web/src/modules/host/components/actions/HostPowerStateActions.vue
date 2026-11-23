<template>
  <template v-if="hasActions">
    <slot name="title" />
    <template v-if="isHostRunning">
      <HostRebootButton v-if="!exclude.reboot" :host />
      <HostForceRebootButton :host />
      <HostSmartRebootButton :host />
      <HostShutdownButton v-if="!exclude.shutdown" :host />
      <HostEmergencyShutdownButton :host />
    </template>
    <HostStartButton v-else :host />
  </template>
</template>

<script lang="ts" setup>
import HostEmergencyShutdownButton from '@/modules/host/components/actions/emergency-shutdown/HostEmergencyShutdownButton.vue'
import HostForceRebootButton from '@/modules/host/components/actions/reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostSmartRebootButton from '@/modules/host/components/actions/reboot/HostSmartRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { HostQuickAction } from '@/modules/host/utils/xo-host.util.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host, exclude = {} } = defineProps<{
  host: FrontXoHost
  exclude?: Partial<Record<HostQuickAction, boolean>>
}>()

defineSlots<{
  title?(): any
}>()

const isHostRunning = computed(() => host.power_state === HOST_POWER_STATE.RUNNING)

const hasActions = computed(() => isHostRunning.value || !exclude.start)
</script>
