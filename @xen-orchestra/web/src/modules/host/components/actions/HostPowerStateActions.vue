<template>
  <template v-if="isHostRunning">
    <HostRebootButton :host />
    <HostForceRebootButton :host />
    <HostSmartRebootButton :host />
    <HostShutdownButton :host />
  </template>
  <HostStartButton v-else :host />
</template>

<script lang="ts" setup>
import HostForceRebootButton from '@/modules/host/components/actions/reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostSmartRebootButton from '@/modules/host/components/actions/reboot/HostSmartRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const isHostRunning = computed(() => host.power_state === HOST_POWER_STATE.RUNNING)
</script>
