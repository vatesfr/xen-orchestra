<template>
  <tr class="pif-row" @click="redirect()">
    <td v-tooltip class="typo p3-regular text-ellipsis host">
      <UiObjectIcon :state="hostPowerState" type="host" size="small" />
      <span v-tooltip class="typo p3-regular text-ellipsis host-name">
        {{ host?.name_label }}
      </span>
    </td>
    <td v-tooltip class="typo p3-regular text-ellipsis device">{{ pif.device }}</td>
    <td v-tooltip class="typo p3-regular status">
      <VtsConnectionStatus v-if="status !== undefined" :status />
    </td>
    <td>
      <UiButtonIcon size="small" accent="brand" :icon="faAngleRight" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
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

const { getByOpaqueRef } = useHostStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()
const { getPifStatus } = usePifStore().subscribe()

const router = useRouter()

const status = computed<ConnectionStatus | undefined>(() => getPifStatus(pif))

const host = computed(() => getByOpaqueRef(pif.host))

const hostStatus = computed(() => (host.value ? isHostRunning(host.value) : undefined))

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
.pif-row {
  cursor: pointer;

  &:hover {
    background-color: var(--color-info-background-hover);
  }

  td {
    color: var(--color-neutral-txt-primary);
  }

  .host {
    width: 14rem;
    max-width: 14rem;

    .host-name {
      margin-left: 0.4rem;
      color: var(--color-info-txt-base);
    }
  }

  .device {
    width: 8rem;
    max-width: 8rem;
  }

  .status {
    width: 12rem;
    max-width: 12rem;
  }
}
</style>
