<template>
  <HostDisableButton v-if="host.enabled" :host />
  <HostEnableButton v-else :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-id="host.id" />
  <HostForgetButton v-if="hostIsHalted" :host />
</template>

<script lang="ts" setup>
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const hostIsHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)
</script>
