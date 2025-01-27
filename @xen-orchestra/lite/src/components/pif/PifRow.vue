<template>
  <tr>
    <td v-if="host" class="typo p3-regular text-ellipsis host">
      <UiObjectIcon :state="hostPowerState" type="host" size="small" />
      <a v-tooltip href="" class="text-ellipsis">
        {{ host.name_label }}
      </a>
    </td>
    <td class="typo p3-regular device text-ellipsis">{{ pif.device }}</td>
    <td class="typo p3-regular status">
      <VtsConnectionStatus v-if="status !== undefined" :status />
    </td>
    <td>
      <UiButtonIcon size="small" accent="info" :icon="faAngleRight" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import VtsConnectionStatus, { type ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const { getByOpaqueRef: getOpaqueRefHost } = useHostStore().subscribe()
const { getByOpaqueRef: getOpaqueRefMetricsHost } = useHostMetricsStore().subscribe()
const { getPifCarrier } = usePifMetricsStore().subscribe()

const pifCarrier = computed(() => getPifCarrier(pif))

const status = computed<ConnectionStatus | undefined>(() => {
  if (pifCarrier.value === undefined) {
    return undefined
  }

  const isPifCurrentlyAttached = pif.currently_attached

  if (pifCarrier.value && isPifCurrentlyAttached) {
    return 'connected'
  }

  if (!pifCarrier.value && isPifCurrentlyAttached) {
    return 'disconnected-from-physical-device'
  }

  return 'disconnected'
})

const host = computed(() => getOpaqueRefHost(pif.host))

const hostStatus = computed(() => (host.value ? getOpaqueRefMetricsHost(host.value.metrics)?.live : undefined))

const hostPowerState = computed(() => (hostStatus.value ? 'running' : 'halted'))
</script>

<style lang="postcss" scoped>
td {
  &.host {
    width: 14rem;
    max-width: 14rem;
  }

  &.device {
    width: 8rem;
    max-width: 8rem;
  }

  &.status {
    width: 12rem;
    max-width: 12rem;
  }
}
</style>
