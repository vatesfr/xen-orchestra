<template>
  <div class="pool-network-view">
    <UiCard class="card">
      <PoolNetworksTable
        :networks="reactiveNetworksWithVLANs"
        :is-ready
        :selected-row-id="selectedNetworkRowId"
        @row-select-network="selectNetwork"
      />
      <PoolHostInternalNetworkTable
        :host-internal-network="reactiveHostInternalNetworks"
        :is-ready
        :selected-row-id="selectedHostInternalRowId"
        @row-select-host-internal-network="selectNetwork"
      />
    </UiCard>
    <PoolNetworksSidePanel v-if="selectedNetworks" :selected-network="selectedNetworks" :selected-pifs="selectedPIFs" />
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
import { watchEffect, ref } from 'vue'

const { networksWithVLANs, hostInternalNetworks, isReady } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()

const selectedNetworks = ref<{
  network: XoNetwork
  status?: string
  vlan?: string
}>()
const selectedPIFs = ref<
  {
    PIF: XoPif
    host?: {
      name_label?: string
      hostStatus?: boolean
    }
  }[]
>()

const reactiveNetworksWithVLANs = ref(networksWithVLANs.value || [])
const reactiveHostInternalNetworks = ref(hostInternalNetworks.value || [])

const selectedNetworkRowId = ref<string | null>(null)
const selectedHostInternalRowId = ref<string | null>(null)
const selectNetwork = (payload: { item: any; table: string }) => {
  if (payload.table === 'network') {
    selectedHostInternalRowId.value = null
    selectedNetworkRowId.value = payload.item.network.id
    const network = reactiveNetworksWithVLANs.value.find(pif => pif.network.id === payload.item.network.id)
    selectedPIFs.value = pifsByNetwork.value.get(network!.network.id)
    if (network) {
      selectedNetworks.value = network
    }
  } else {
    const hostInternalNetwork = reactiveHostInternalNetworks.value.find(pif => pif.id === payload.item.id)
    selectedNetworkRowId.value = null
    selectedHostInternalRowId.value = payload.item.id
    if (hostInternalNetwork) {
      selectedNetworks.value = {
        network: hostInternalNetwork,
        status: undefined,
        vlan: undefined,
      }
    }
  }
}

watchEffect(() => {
  if (networksWithVLANs.value) {
    reactiveNetworksWithVLANs.value = networksWithVLANs.value || []
  }
  if (hostInternalNetworks.value) {
    reactiveHostInternalNetworks.value = hostInternalNetworks.value || []
  }
})
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
