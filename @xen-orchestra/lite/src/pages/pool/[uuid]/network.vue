<template>
  <div class="pool-network-view" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <PoolNetworksTable :networks="networksWithPifs" />
      <PoolHostInternalNetworksTable :networks="networksWithoutPifs" />
    </UiCard>
    <PoolNetworkSidePanel :network="selectedNetwork" @close="selectedNetwork = undefined" />
  </div>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworksTable from '@/components/pool/network/PoolHostInternalNetworksTable.vue'
import PoolNetworkSidePanel from '@/components/pool/network/PoolNetworkSidePanel.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
usePageTitleStore().setTitle(t('network'))

const { getByUuid, networksWithPifs, networksWithoutPifs } = useNetworkStore().subscribe()
const panelStore = usePanelStore()
const uiStore = useUiStore()

const selectedNetwork = useRouteQuery<XenApiNetwork | undefined>('id', {
  toData: id => getByUuid(id as XenApiNetwork['uuid']),
  toQuery: network => network?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.pool-network-view {
  &.locked:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
