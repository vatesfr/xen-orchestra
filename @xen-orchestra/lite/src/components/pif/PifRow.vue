<template>
  <tr class="pif-row" :class="{ compact }">
    <td class="typo-body-regular-small host">
      <HostLink
        v-if="host"
        :host
        :to="{ name: '/host/[uuid]/network', params: { uuid: host.uuid }, query: { id: pif.uuid } }"
        size="small"
        class="host-link"
      >
        <span v-tooltip class="text-ellipsis">{{ host.name_label }}</span>
      </HostLink>
      <span v-else>{{ t('host:status:unknown') }}</span>
    </td>
    <td v-tooltip class="typo-body-regular-small text-ellipsis device">{{ pif.device }}</td>
    <td class="typo-body-regular-small status">
      <VtsStatus :status :icon-only="compact" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import HostLink from '@/modules/host/components/HostLink.vue'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: XenApiPif
  compact?: boolean
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useHostStore().subscribe()
const { getPifStatus } = usePifStore().subscribe()

const host = computed(() => getByOpaqueRef(pif.host))

const status = computed(() => getPifStatus(pif))
</script>

<style lang="postcss" scoped>
.pif-row {
  td {
    color: var(--color-neutral-txt-primary);
  }

  .host-link {
    max-width: 100%;
  }

  &:not(.compact) {
    .host {
      max-width: 14rem;
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

  &.compact .device {
    padding-inline-start: 1.6rem;
  }
}
</style>
