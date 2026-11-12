<template>
  <VtsChangeStateMenuItem v-if="showChangeState">
    <HostPowerStateActions :host />
  </VtsChangeStateMenuItem>
  <HostRestartToolstackButton :host />
  <HostDisableButton v-if="displayDisableButton" :host />
  <HostEnableButton v-else :host />
  <HostDetachButton :host />
  <HostForgetButton :host />
  <VtsDivider type="stretch" />
  <HostDownloadButton :host-opaque-ref="host.$ref" />
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostDetachButton from '@/modules/host/components/actions/detach/HostDetachButton.vue'
import HostDisableButton from '@/modules/host/components/actions/disable/HostDisableButton.vue'
import HostDownloadButton from '@/modules/host/components/actions/download/HostDownloadButton.vue'
import HostEnableButton from '@/modules/host/components/actions/enable/HostEnableButton.vue'
import HostForgetButton from '@/modules/host/components/actions/forget/HostForgetButton.vue'
import HostPowerStateActions from '@/modules/host/components/actions/HostPowerStateActions.vue'
import HostRestartToolstackButton from '@/modules/host/components/actions/restart-toolstack/HostRestartToolstackButton.vue'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import { HOST_POWER_STATE } from '@vates/types'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
  showChangeState?: boolean
}>()

const { getHostPowerState } = useHostMetricsStore().subscribe()

const isHostHalted = computed(() => getHostPowerState(host) === HOST_POWER_STATE.HALTED)

const displayDisableButton = computed(() => host.enabled || isHostHalted.value)
</script>
