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
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsConnectionStatus, { type ConnectionStatus } from '@core/components/connection-status/VtsConnectionStatus.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { pif } = defineProps<{
  pif: XoPif
}>()
const { records: hosts } = useHostStore().subscribe()

const router = useRouter()

const status = computed<ConnectionStatus | undefined>(() => {
  if (pif.carrier === undefined) {
    return undefined
  }

  if (pif.carrier && pif.attached) {
    return 'connected'
  }
  if (!pif.carrier && pif.attached) {
    return 'disconnected-from-physical-device'
  }
  return 'disconnected'
})

const host = computed(() => hosts.value.find(host => host.id === pif.$host))

const hostPowerState = computed(() => {
  return host.value?.power_state ? 'running' : 'halted'
})

const redirect = () => {
  if (host.value === undefined) {
    return
  }
  router.push({
    name: '/host/[id]/networks',
    params: { id: host.value.id },
    query: { id: pif.id },
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
