<template>
  <tr @click="redirect()">
    <td v-if="host" class="typo p3-regular text-ellipsis host">
      <UiObjectIcon :state="hostPowerState" type="host" size="small" />
      <span v-tooltip class="typo p3-regular text-ellipsis host-name">
        {{ host.name_label }}
      </span>
    </td>
    <td class="typo p3-regular text-ellipsis device">{{ pif.device }}</td>
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
import { useRouter } from 'vue-router'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const { getByOpaqueRef: getOpaqueRefHost } = useHostStore().subscribe()
const { getByOpaqueRef: getOpaqueRefMetricsHost } = useHostMetricsStore().subscribe()
const { getPifCarrier } = usePifMetricsStore().subscribe()

const router = useRouter()

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

const redirect = () => {
  if (host.value === undefined) {
    return
  }

  router.push({
    name: 'host.network',
    params: { uuid: host.value.uuid },
    query: { id: pif.uuid },
  })
}
</script>

<style lang="postcss" scoped>
td {
  &.host {
    width: 14rem;
    max-width: 14rem;

    .host-name {
      margin-left: 0.4rem;
      color: var(--color-info-txt-base);
    }
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
