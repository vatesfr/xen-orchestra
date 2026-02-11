<template>
  <div class="networks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks>
        <template #title-actions>
          <UiLink :href="xo5NewNetworkHref" icon="fa:plus" size="medium">
            {{ t('action:add-network-in-xo-5') }}
          </UiLink>
        </template>
      </NetworksTable>
      <NetworksTable :busy="!areNetworksReady" :error="hasNetworkFetchError" :networks="internalNetworks" internal>
        <template #title-actions>
          <UiLink :href="xo5NewNetworkHref" icon="fa:plus" size="medium">
            {{ t('action:add-host-internal-network-in-xo-5') }}
          </UiLink>
        </template>
      </NetworksTable>
    </UiCard>
    <NetworkSidePanel v-if="selectedNetwork" :network="selectedNetwork" @close="selectedNetwork = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import NetworksTable from '@/modules/network/components/NetworksTable.vue'
import NetworkSidePanel from '@/modules/network/components/panel/NetworkSidePanel.vue'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { XoNetwork, XoPool } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5NewNetworkHref = computed(() => buildXo5Route(`/new/network?pool=${pool.id}`))

const { areNetworksReady, hasNetworkFetchError, networksWithoutPifs, networksWithPifs, getNetworkById } =
  useXoNetworkCollection()
const uiStore = useUiStore()

const internalNetworks = computed(() => networksWithoutPifs.value.filter(network => network.$pool === pool.id))

const networks = computed(() => networksWithPifs.value.filter(network => network.$pool === pool.id))

const selectedNetwork = useRouteQuery<XoNetwork | undefined>('id', {
  toData: id => getNetworkById(id as XoNetwork['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  &:not(.mobile) {
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
