<template>
  <UiPanelCard class="storage-repository-hosts-card">
    <UiPanelCardTitle size="medium" :label="t('hosts')" :counter="hosts.length" />
    <UiCollapsibleList v-if="hosts.length > 0" tag="ul" :total-items="hosts.length">
      <li v-for="host in hosts" :key="host.id" v-tooltip class="text-ellipsis">
        <HostLink :host="host" size="small" />
      </li>
    </UiCollapsibleList>
    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-host-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import HostLink from '@/modules/host/components/HostLink.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  hosts: FrontXoHost[]
}>()

const { t } = useI18n()
</script>
