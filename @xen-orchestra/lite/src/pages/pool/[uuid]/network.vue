<template>
  <VtsContentSidePanel class="network">
    <UiCard class="container">
      <PoolNetworksTable :networks="networksWithPifs" :busy="!isReady" :error="hasError">
        <template #title-actions>
          <MenuList placement="bottom-end">
            <template #trigger="{ open }">
              <UiDropdownButton @click="open($event)">{{ t('new') }}</UiDropdownButton>
            </template>
            <MenuItem>
              <UiLink
                class="new-network-link"
                :to="{ name: '/network/new', query: { poolid: pool?.uuid } }"
                icon="fa:plus"
                size="medium"
              >
                {{ t('action:create-network') }}
              </UiLink>
            </MenuItem>
            <MenuItem>
              <UiLink
                class="new-network-link"
                :to="{ name: '/network/new-bonded', query: { poolid: pool?.uuid } }"
                icon="fa:plus"
                size="medium"
              >
                {{ t('action:create-bonded-network') }}
              </UiLink>
            </MenuItem>
          </MenuList>
        </template>
      </PoolNetworksTable>
      <PoolHostInternalNetworksTable :networks="networksWithoutPifs" />
    </UiCard>
    <PoolNetworkSidePanel :network="selectedNetwork" @close="selectedNetwork = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworksTable from '@/components/pool/network/PoolHostInternalNetworksTable.vue'
import PoolNetworkSidePanel from '@/components/pool/network/PoolNetworkSidePanel.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useI18n } from 'vue-i18n'

const { pool } = usePoolStore().subscribe()

const { t } = useI18n()
usePageTitleStore().setTitle(t('network'))

const { getByUuid, networksWithPifs, networksWithoutPifs, isReady, hasError } = useNetworkStore().subscribe()

const selectedNetwork = useRouteQuery<XenApiNetwork | undefined>('id', {
  toData: id => getByUuid(id as XenApiNetwork['uuid']),
  toQuery: network => network?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.network {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}

.new-network-link {
  height: 100%;
  width: 100%;
}
</style>
