<template>
  <VtsContentSidePanel class="networks">
    <UiCard class="container">
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks>
        <template #title-actions>
          <MenuList placement="bottom-end">
            <template #trigger="{ open }">
              <UiDropdownButton size="medium" @click="open($event)">{{ t('new') }}</UiDropdownButton>
            </template>
            <MenuItem>
              <UiLink
                class="new-network-link"
                :to="{ name: '/network/new', query: { poolid: pool.id } }"
                icon="fa:plus"
                size="medium"
              >
                {{ t('action:create-network') }}
              </UiLink>
            </MenuItem>
            <MenuItem>
              <UiLink
                class="new-network-link"
                :to="{ name: '/network/new-bonded', query: { poolid: pool.id } }"
                icon="fa:plus"
                size="medium"
              >
                {{ t('action:create-bonded-network') }}
              </UiLink>
            </MenuItem>
          </MenuList>
        </template>
      </NetworksTable>
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks="internalNetworks" internal>
        <template #title-actions>
          <UiLink :to="{ name: '/network/new-internal', query: { poolid: pool.id } }" icon="fa:plus" size="medium">
            {{ t('new') }}
          </UiLink>
        </template>
      </NetworksTable>
    </UiCard>
    <NetworkSidePanel :network="selectedNetwork" @close="selectedNetwork = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import NetworksTable from '@/modules/network/components/NetworksTable.vue'
import NetworkSidePanel from '@/modules/network/components/panel/NetworkSidePanel.vue'
import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { areNetworksReady, hasNetworkFetchError, networksWithoutPifs, networksWithPifs, getNetworkById } =
  useXoNetworkCollection()

const internalNetworks = computed(() => networksWithoutPifs.value.filter(network => network.$pool === pool.id))

const networks = computed(() => networksWithPifs.value.filter(network => network.$pool === pool.id))

const selectedNetwork = useRouteQuery<FrontXoNetwork | undefined>('id', {
  toData: id => getNetworkById(id as FrontXoNetwork['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}

/* This selector can't be nested,
* as the links in MenuItem are teleported and are not children of .networks element.
* This selector extends the clickable area of the links for better accessibility
*/
.new-network-link {
  height: 100%;
  width: 100%;
}
</style>
