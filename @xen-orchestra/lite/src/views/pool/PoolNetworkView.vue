<template>
  <div class="pool-network-view">
    <UiCard class="card">
        <PoolNetworksTable :networks="networksWithVLANs" :is-ready @row-select-network="selectNetwork" />
        <PoolHostInternalNetworkTable :networks="hostInternalNetworks" :is-ready @row-select-host-internal-network="selectNetwork"
        />
    </UiCard>
    <PoolNetworksSidePanel v-if="selectedNetworks" :selected-network="selectedNetworks" :selected-pifs="selectedPIFs" />
    <UiPanel v-else class="panel-container">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworkTable from '@/components/pool/network/PoolHostInternalNetworkTable.vue'
import PoolNetworksSidePanel from '@/components/pool/network/PoolNetworksSidePanel.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { networksWithVLANs, hostInternalNetworks, isReady, getPIFsInformationByNetwork } = useNetworkStore().subscribe()

const selectedNetworks = ref<{
  network: XenApiNetwork
  status?: string
  vlan?: string
}>()

const selectedPIFs = ref<
  {
    PIF: XenApiPif
    host?: {
      name_label?: string
      hostStatus?: boolean
    }
  }[]
>()


const selectNetwork = (item: any) => {
  if (item.network) {
    const network = networksWithVLANs.value.find(pif => pif.network.uuid === item.network.uuid)
    selectedPIFs.value = getPIFsInformationByNetwork(item.network)
    if (network) {
      selectedNetworks.value = {
        network: network.network,
        status: network.status,
        vlan: network.vlan,
      }
    }
  } else {
    const hostInternalNetwork = hostInternalNetworks.value.find(pif => pif.uuid === item.uuid)
    if (hostInternalNetwork) {
      selectedNetworks.value = {
        network: hostInternalNetwork,
        status: undefined,
        vlan: undefined,
      }
    }
  }
}

</script>

<style lang="postcss" scoped>
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

  .panel-container {
    width: 40rem;
    border-top: none;
  }
}
</style>
