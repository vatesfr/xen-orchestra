<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('hosts')" :counter="hosts.length" />
    <UiCollapsibleList v-if="hosts.length > 0" tag="ul" :total-items="hosts.length">
      <li v-for="host in hosts" :key="host.uuid" v-tooltip class="text-ellipsis">
        <UiLink
          size="small"
          :icon="`object:host:${getHostPowerState(host)}`"
          :to="{ name: '/host/[uuid]/dashboard', params: { uuid: host.uuid } }"
        >
          {{ host.name_label }}
        </UiLink>
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-host-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  hosts: XenApiHost[]
}>()

const { t } = useI18n()

const { isHostRunning } = useHostMetricsStore().subscribe()

function getHostPowerState(host: XenApiHost) {
  return isHostRunning(host) ? 'running' : 'halted'
}
</script>
