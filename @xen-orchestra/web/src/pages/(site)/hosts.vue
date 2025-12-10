<template>
  <div class="hosts" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <HostsTable :hosts :busy="!areHostsReady" :error="hasHostFetchError" />
    </UiCard>
    <HostsSidePanel v-if="selectedHost" :host="selectedHost" @close="selectedHost = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection'
import HostsTable from '@xen-orchestra/web/src/components/hosts/HostsTable.vue'
import HostsSidePanel from '@xen-orchestra/web/src/components/hosts/panel/HostsSidePanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import type { XoHost } from '@vates/types'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()

const { hosts, getHostById, hasHostFetchError, areHostsReady } = useXoHostCollection()

const { t } = useI18n()

const selectedHost = useRouteQuery<XoHost | undefined>('id', {
  toData: id => getHostById(id as XoHost['id']),
  toQuery: host => host?.id ?? '',
})
</script>

<style scoped lang="postcss">
.hosts {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
