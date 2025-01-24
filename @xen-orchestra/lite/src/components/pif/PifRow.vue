<template>
  <tr>
    <td v-if="hostInfo" class="typo p3-regular text-ellipsis host">
      <UiObjectIcon :state="hostState" type="host" size="small" />
      <a v-tooltip href="" class="text-ellipsis">
        {{ hostInfo.name_label }}
      </a>
    </td>
    <td class="typo p3-regular device text-ellipsis">{{ pif.device }}</td>
    <td class="typo p3-regular status">
      <VtsConnectionStatus v-if="pifCarrier !== undefined" :status />
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
const pifCurrentlyAttached = pif.currently_attached

const status = computed((): ConnectionStatus => {
  if (pifCarrier.value && pifCurrentlyAttached) return 'connected'
  if (!pifCarrier.value && pifCurrentlyAttached) return 'disconnected-from-physical-device'
  return 'disconnected'
})

const hostInfo = getOpaqueRefHost(pif.host)
const hostStatus = hostInfo ? getOpaqueRefMetricsHost(hostInfo.metrics)?.live : ''

const hostState = computed(() => {
  return hostStatus ? 'running' : 'disabled'
})
</script>

<style lang="postcss" scoped>
td.host {
  width: 13rem;
  max-width: 13rem;
}

td.device {
  width: 6rem;
  max-width: 6rem;
}

td.status {
  width: 14rem;
  max-width: 14rem;
}
</style>
