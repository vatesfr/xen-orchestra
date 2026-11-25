<template>
  <VtsContentSidePanel class="networks">
    <UiCard class="container">
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks>
        <template #title-actions>
          <VtsResponsiveMenu :title="t('new')" placement="bottom-end">
            <template #trigger="{ open, bindings }">
              <UiDropdownButton v-bind="bindings" variant="primary" size="medium" @click="open($event)">
                {{ t('new') }}
              </UiDropdownButton>
            </template>
            <PoolNewNetworkButton :pool />
            <PoolNewBondedNetworkButton :pool />
          </VtsResponsiveMenu>
        </template>
      </NetworksTable>
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks="privateNetworks" type="private">
        <template #title-actions>
          <PoolNewPrivateNetworkButton :pool />
        </template>
      </NetworksTable>
      <NetworksTable
        :busy="!areNetworksReady"
        :error="hasNetworkFetchError"
        :networks="internalNetworks"
        type="internal"
      >
        <template #title-actions>
          <PoolNewInternalNetworkButton :pool />
        </template>
      </NetworksTable>
    </UiCard>
    <template #panel>
      <NetworkSidePanel :network="selectedNetwork" @close="selectedNetwork = undefined" />
    </template>
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import NetworksTable from '@/modules/network/components/NetworksTable.vue'
import NetworkSidePanel from '@/modules/network/components/panel/NetworkSidePanel.vue'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PoolNewBondedNetworkButton from '@/modules/pool/components/actions/new-bonded-network/PoolNewBondedNetworkButton.vue'
import PoolNewInternalNetworkButton from '@/modules/pool/components/actions/new-internal-network/PoolNewInternalNetworkButton.vue'
import PoolNewNetworkButton from '@/modules/pool/components/actions/new-network/PoolNewNetworkButton.vue'
import PoolNewPrivateNetworkButton from '@/modules/pool/components/actions/new-private-network/PoolNewPrivateNetworkButton.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import VtsResponsiveMenu from '@core/components/menu/VtsResponsiveMenu.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const {
  areNetworksReady,
  hasNetworkFetchError,
  physicalNetworks,
  privateNetworks: allPrivateNetworks,
  internalNetworks: allInternalNetworks,
  getNetworkById,
} = useXoNetworkCollection()

const networks = computed(() => physicalNetworks.value.filter(network => network.$pool === pool.id))

const privateNetworks = computed(() => allPrivateNetworks.value.filter(network => network.$pool === pool.id))

const internalNetworks = computed(() => allInternalNetworks.value.filter(network => network.$pool === pool.id))

const selectedNetwork = useRouteQuery<FrontXoNetwork | undefined>('id', {
  toData: id => getNetworkById(id as FrontXoNetwork['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style lang="postcss" scoped>
.networks {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
