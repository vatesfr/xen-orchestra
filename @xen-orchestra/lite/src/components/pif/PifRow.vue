<template>
  <tr class="pif-row" :class="{ clickable: pifHost }" @click="pifHost?.redirect()">
    <td v-tooltip class="typo-body-regular-small text-ellipsis host-container">
      <div v-if="pifHost" class="host">
        <UiObjectIcon :state="pifHost.powerState" type="host" size="small" />
        <span v-tooltip class="typo-body-regular-small text-ellipsis host-name">
          {{ pifHost.label }}
        </span>
      </div>
      <div v-else>
        <span>{{ t('host-unknown') }}</span>
      </div>
    </td>
    <td v-tooltip class="typo-body-regular-small text-ellipsis device">{{ pif.device }}</td>
    <td v-tooltip class="typo-body-regular-small status">
      <VtsConnectionStatus :status />
    </td>
    <td>
      <UiButtonIcon size="small" accent="brand" :icon="faAngleRight" :disabled="!pifHost" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useHostStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()
const { getPifStatus } = usePifStore().subscribe()

const router = useRouter()

const status = computed(() => getPifStatus(pif))

const pifHost = computed(() => {
  const host = getByOpaqueRef(pif.host)

  if (!host) {
    return
  }

  return {
    label: host.name_label,
    powerState: isHostRunning(host) ? 'running' : 'halted',
    redirect() {
      router.push({
        name: 'host.network',
        params: { uuid: host.uuid },
        query: { id: pif.uuid },
      })
    },
  } as const
})
</script>

<style lang="postcss" scoped>
.pif-row {
  &.clickable {
    cursor: pointer;

    &:hover {
      background-color: var(--color-brand-background-hover);
    }
  }

  td {
    color: var(--color-neutral-txt-primary);
  }

  .host-container {
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
    width: 11.5rem;
    max-width: 11.5rem;
  }
}
</style>
