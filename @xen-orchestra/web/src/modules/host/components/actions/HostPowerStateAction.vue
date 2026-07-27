<template>
  <div v-if="hostIsRunning">
    <HostRebootButton :host />
    <HostForceRebootButton :host />
    <HostShutdownButton :host />
  </div>
  <HostStartButton v-else :host />
</template>

<script lang="ts" setup>
import HostForceRebootButton from '@/modules/host/components/actions/force-reboot/HostForceRebootButton.vue'
import HostRebootButton from '@/modules/host/components/actions/reboot/HostRebootButton.vue'
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const hostIsRunning = computed(() => host.power_state === HOST_POWER_STATE.RUNNING)
</script>
