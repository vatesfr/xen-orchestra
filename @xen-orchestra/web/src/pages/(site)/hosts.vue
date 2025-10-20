<template>
  <div class="host" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <UiTitle>{{ t('hosts') }}</UiTitle>
      <HostsTable :hosts :host-ready="areHostsReady" :has-error="hasHostFetchError" />
    </UiCard>
    <HostsSidePanel v-if="selectedHost && areHostsReady" :host="selectedHost" @close="selectedHost = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero v-if="!areHostsReady" format="panel" busy size="medium" />
      <VtsStateHero v-else format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostsSidePanel from '@/components/hosts/hostsSidePanel.vue'
import HostsTable from '@/components/hosts/hostsTable.vue'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import type { XoHost } from '@/types/xo/host.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { hosts, getHostById, areHostsReady, hasHostFetchError } = useXoHostCollection()

const { t } = useI18n()

const selectedHost = useRouteQuery<XoHost | undefined>('id', {
  toData: id => getHostById(id as XoHost['id']),
  toQuery: backupJob => backupJob?.id ?? '',
})
</script>

<style scoped lang="postcss">
.host {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }
}

.container {
  height: fit-content;
  gap: 4rem;
  margin: 0.8rem;
}
</style>
