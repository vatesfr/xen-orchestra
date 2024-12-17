<template>
  <div class="pool-network-view">
    <UiCard class="card">
      <PoolNetworksTable
        :networks="networksWithPifs"
        :is-ready
        :has-error
        :selected-row-id="selectedNetworkRowId"
        @row-select-network="selectNetwork"
      />
      <PoolHostInternalNetworkTable
        :host-internal-network="hostInternalNetworks"
        :is-ready
        :has-error
        :selected-row-id="selectedHostInternalRowId"
        @row-select-host-internal-network="selectNetwork"
      />
    </UiCard>
    <PoolNetworksSidePanel v-if="selectedNetwork" :network="selectedNetwork" :pifs="selectedPifs" />
    <UiPanel v-else class="panel">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolHostInternalNetworkTable from '@/components/pool/PoolHostInternalNetworkTable.vue'
import PoolNetworksSidePanel from '@/components/pool/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/PoolNetworksTable.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed, ref, watchEffect } from 'vue'

const { records: networks, isReady, hasError } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()
const selectedNetwork = ref<XoNetwork | null>(null)
const selectedPifs = ref<XoPif[]>([])
const selectedNetworkRowId = ref<string | null>(null)
const selectedHostInternalRowId = ref<string | null>(null)
const highLightedNetworkId = useRouteQuery('id')

const networksWithPifs = computed(() => networks.value.filter(network => network.PIFs.length > 0))
const hostInternalNetworks = computed(() => networks.value.filter(network => network.PIFs.length === 0))

const selectNetwork = (payload: { item: XoNetwork; table: string }) => {
  highLightedNetworkId.value = payload.item.id
  const resetSelections = () => {
    selectedHostInternalRowId.value = null
    selectedNetworkRowId.value = null
    selectedPifs.value = []
    selectedNetwork.value = null
  }

  const handleNetworkSelection = (networkId: string) => {
    selectedNetworkRowId.value = networkId
    const network = networksWithPifs.value.find(network => network.id === networkId)
    selectedPifs.value = pifsByNetwork.value.get(network?.id || '') || []
    selectedNetwork.value = network || null
  }

  const handleHostInternalSelection = (hostInternalId: string) => {
    selectedHostInternalRowId.value = hostInternalId
    const hostInternalNetwork = hostInternalNetworks.value.find(pif => pif.id === hostInternalId)
    selectedNetwork.value = hostInternalNetwork || null
  }

  resetSelections()

  if (payload.table === 'network') {
    handleNetworkSelection(payload.item.id)
  } else {
    handleHostInternalSelection(payload.item.id)
  }
}

watchEffect(() => {
  if (highLightedNetworkId.value && networks.value.length > 0) {
    selectedNetwork.value = null
    selectedNetworkRowId.value = null
    selectedHostInternalRowId.value = null
    const selected =
      networksWithPifs.value.find(network => network.id === highLightedNetworkId.value) ||
      hostInternalNetworks.value.find(network => network.id === highLightedNetworkId.value)

    if (selected) {
      selectedNetwork.value = selected
      if (networksWithPifs.value.includes(selected)) {
        selectedNetworkRowId.value = selected.id
      } else {
        selectedHostInternalRowId.value = selected.id
      }
    }
  }
})
</script>

<style scoped lang="postcss">
.pool-network-view {
  display: flex;

  .card {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4rem;
    margin: 0.8rem;
    border: solid 0.1rem var(--color-neutral-border);
    border-radius: 0.8rem;
    overflow: hidden;
  }

  .panel {
    width: 40rem;
    border-top: none;
  }
}
</style>
