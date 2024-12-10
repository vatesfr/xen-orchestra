<template>
  <div class="pool-network-view">
    <UiCard class="card">
      <PoolNetworksTable
        :networks="networksWithPIFs"
        :is-ready
        :selected-row-id="selectedNetworkRowId"
        @row-select-network="selectNetwork"
      />
      <PoolHostInternalNetworkTable
        :host-internal-network="hostInternalNetworks"
        :is-ready
        :selected-row-id="selectedHostInternalRowId"
        @row-select-host-internal-network="selectNetwork"
      />
    </UiCard>
    <PoolNetworksSidePanel v-if="selectedNetwork" :selected-network :selected-pifs="selectedPIFs" />
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
import { ref } from 'vue'

const { networksWithPIFs, hostInternalNetworks, isReady } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()

const selectedNetwork = ref<XoNetwork | undefined>(undefined)
const selectedPIFs = ref<XoPif[] | undefined>(undefined)

const selectedNetworkRowId = ref<string | null>(null)
const selectedHostInternalRowId = ref<string | null>(null)

const selectNetwork = (payload: { item: XoNetwork; table: string }) => {
  if (payload.table === 'network') {
    selectedHostInternalRowId.value = null
    selectedNetworkRowId.value = payload.item.id
    const network = networksWithPIFs.value.find(network => network.id === payload.item.id)
    selectedPIFs.value = pifsByNetwork.value.get(network!.id)
    if (network) {
      selectedNetwork.value = network
    }
  } else {
    const hostInternalNetwork = hostInternalNetworks.value.find(pif => pif.id === payload.item.id)
    selectedNetworkRowId.value = null
    selectedHostInternalRowId.value = payload.item.id
    if (hostInternalNetwork) {
      selectedNetwork.value = hostInternalNetwork
    }
  }
}
</script>

<style scoped lang="postcss">
.pool-network-view {
  display: flex;

  .card {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    margin: 0.8rem;
    border: solid 0.1rem var(--color-neutral-border);
    border-radius: 0.8rem;
  }

  .panel {
    width: 40rem;
    border-top: none;
  }
}
</style>
