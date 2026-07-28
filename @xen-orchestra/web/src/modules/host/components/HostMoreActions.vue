<template>
  <HostRestartToolstackButton :host />
  <template v-if="canDisableHost">
    <HostDisableButton :host />
    <HostDisableAndEvacuateVmButton :host />
  </template>
  <HostEnableButton v-else :host />
  <HostDetachButton :host />
  <HostForgetButton v-if="hostIsHalted" :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-id="host.id" />
</template>

<script lang="ts" setup>
import HostDetachButton from '@/modules/host/components/actions/detach/HostDetachButton.vue'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDisableAndEvacuateVmButton from '@/modules/host/components/actions/disable-and-evacuate-vms/HostDisableAndEvacuateVmButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostRestartToolstackButton from '@/modules/host/components/actions/restart-toolstack/HostRestartToolstackButton.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { isHostOperationPending } from '@/modules/host/utils/xo-host.util.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const hostIsHalted = computed(() => host.power_state === HOST_POWER_STATE.HALTED)

const isEvacuateVm = computed(() => isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.EVACUATE))

const canDisableHost = computed(() => host.enabled || hostIsHalted.value || isEvacuateVm.value)
</script>
