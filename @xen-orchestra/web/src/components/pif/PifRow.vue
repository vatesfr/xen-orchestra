<template>
  <tr>
    <td v-if="host" class="typo p3-regular text-ellipsis host">
      <UiObjectIcon :state="hostState" type="host" size="small" />
      <a v-tooltip class="text-ellipsis">
        {{ host.name_label }}
      </a>
    </td>
    <td class="typo p3-regular device text-ellipsis">{{ pif.device }}</td>
    <td class="typo p3-regular status">
      <VtsConnectionStatus :status />
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

const { pif } = defineProps<{
  pif: XoPif
}>()

const { records: hosts } = useHostStore().subscribe()

const status = computed<ConnectionStatus>(() => {
  if (pif.carrier && pif.attached) {
    return 'connected'
  }

  if (pif.carrier || pif.attached) {
    return 'disconnected-from-physical-device'
  }

  return 'disconnected'
})

const host = computed(() => hosts.value.find(host => host.id === pif.$host))

const hostState = computed(() => {
  return host.value?.power_state ? 'running' : 'disabled'
})

// TODO: Select the right row in network table, wait for the PR #8198 to implementation
// const redirectToHostNetwork = (pif: XoPif) => {
//   router.push({ name: '/host/[id]/network', params: { id: pif.$host }, query: { pif: pif.id } })
// }
</script>

<style scoped lang="postcss">
td {
  padding: 0 0.4rem;
}

td.host {
  width: 13rem;
  max-width: 13rem;
}

td.device {
  width: 6rem;
  max-width: 6rem;
}

td.status {
  width: 12rem;
  max-width: 12rem;
}

tbody tr {
  cursor: pointer;

  &:hover {
    background-color: var(--color-info-background-hover);
  }
}

tbody tr td {
  color: var(--color-neutral-txt-primary);
}

tbody tr td a {
  margin-left: 0.8rem;
  text-decoration: underline solid #6b63bf;
}
</style>
