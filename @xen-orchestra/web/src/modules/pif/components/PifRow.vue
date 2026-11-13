<template>
  <tr class="pif-row" :class="{ compact }">
    <td class="typo-body-regular-small host">
      <HostLink
        v-if="host"
        :host
        :to="{ name: '/host/[id]/networks', params: { id: host.id }, query: { id: pif.id } }"
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
import HostLink from '@/modules/host/components/HostLink.vue'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { getPifStatus } from '@/modules/pif/utils/xo-pif.util.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: FrontXoPif
  compact?: boolean
}>()

const { t } = useI18n()

const { getHostById } = useXoHostCollection()

const host = computed(() => getHostById(pif.$host))

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
      width: 12rem;
      max-width: 12rem;
    }
  }

  &.compact .device {
    padding-inline-start: 1.6rem;
  }
}
</style>
