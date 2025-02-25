<template>
  <div class="pool-network-view">
    <UiCard class="container">
      <PoolNetworksTable :networks="networksWithPifs" />
      <PoolHostInternalNetworksTable :networks="networksWithoutPifs" />
    </UiCard>
    <PoolNetworkSidePanel v-if="selectedNetwork" :network="selectedNetwork" />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworksTable from '@/components/pool/network/PoolHostInternalNetworksTable.vue'
import PoolNetworkSidePanel from '@/components/pool/network/PoolNetworkSidePanel.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { getByUuid, networksWithPifs, networksWithoutPifs } = useNetworkStore().subscribe()

const selectedNetwork = useRouteQuery<XenApiNetwork | undefined>('id', {
  toData: id => getByUuid(id as XenApiNetwork['uuid']),
  toQuery: network => network?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.pool-network-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
