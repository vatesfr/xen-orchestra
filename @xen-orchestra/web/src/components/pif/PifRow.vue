<template>
  <tr class="pif-row" :class="{ disabled: !pifHost }" @click="pifHost?.redirect()">
    <td v-tooltip class="typo p3-regular text-ellipsis host-container">
      <div v-if="pifHost" class="host">
        <UiObjectIcon :state="pifHost.powerState" type="host" size="small" />
        <span v-tooltip class="typo p3-regular text-ellipsis host-name">
          {{ pifHost.label }}
        </span>
      </div>
      <div v-else>
        <span>{{ $t('host-unknown') }}</span>
      </div>
    </td>
    <td v-tooltip class="typo p3-regular text-ellipsis device">{{ pif.device }}</td>
    <td v-tooltip class="typo p3-regular status">
      <VtsConnectionStatus :status />
    </td>
    <td>
      <UiButtonIcon size="small" accent="brand" :icon="faAngleRight" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
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
const { getPifStatus } = usePifStore().subscribe()

const router = useRouter()

const status = computed(() => getPifStatus(pif))

const pifHost = computed(() => {
  const host = hosts.value.find(host => host.id === pif.$host)

  if (!host) {
    return
  }

  return {
    label: host.name_label,
    powerState: host.power_state ? 'running' : 'halted',
    redirect() {
      router.push({
        name: '/host/[id]/networks',
        params: { id: host.id },
        query: { id: pif.id },
      })
    },
  } as const
})
</script>

<style lang="postcss" scoped>
.pif-row {
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;

    &:hover {
      background-color: var(--color-neutral-background-disabled);
    }
  }

  &:hover {
    background-color: var(--color-brand-background-hover);
  }

  td {
    color: var(--color-neutral-txt-primary);
  }

  .host-container {
    width: 14rem;
    max-width: 14rem;

    .host {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .host-name {
      color: var(--color-brand-txt-base);
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
