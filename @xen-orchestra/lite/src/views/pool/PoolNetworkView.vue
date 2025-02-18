<template>
  <div class="pool-network-view">
    <UiCard class="container">
      <PoolNetworksTable />
      <PoolHostInternalNetworksTable />
    </UiCard>
    <PoolNetworksSidePanel :network />
  </div>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworksTable from '@/components/pool/network/PoolHostInternalNetworksTable.vue'
import PoolNetworksSidePanel from '@/components/pool/network/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { records: networks } = useNetworkStore().subscribe()

const networkId = useRouteQuery('id')

const network = computed(() => networks.value.find(network => network.uuid === networkId.value))
</script>

<style lang="postcss" scoped>
.pool-network-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .container {
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
