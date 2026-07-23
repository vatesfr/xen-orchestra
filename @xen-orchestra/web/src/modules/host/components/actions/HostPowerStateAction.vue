<template>
  <HostShutdownButton v-if="hostIsRunning" :host />
  <HostStartButton v-if="hostIsHalted" :host />
</template>

<script lang="ts" setup>
import HostShutdownButton from '@/modules/host/components/actions/shutdown/HostShutdownButton.vue'
import HostStartButton from '@/modules/host/components/actions/start/HostStartButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const hostIsHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)

const hostIsRunning = computed(() => host.power_state === HOST_POWER_STATE.RUNNING)
</script>
