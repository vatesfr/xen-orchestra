<template>
  <UiCard class="pool-network-view">
    <div class="content">
      <PoolNetworksTable :networks="reactiveNetworksWithVLANs" :is-ready />
      <PoolHostInternalNetworkTable :host-internal-network="reactiveHostInternalNetworks" :is-ready />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworkTable from '@/components/pool/network/PoolHostInternalNetworkTable.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { networksWithVLANs, hostInternalNetworks, isReady } = useNetworkStore().subscribe()

const reactiveNetworksWithVLANs = ref(networksWithVLANs.value || [])
const reactiveHostInternalNetworks = ref(hostInternalNetworks.value || [])

watchEffect(() => {
  if (networksWithVLANs.value) {
    reactiveNetworksWithVLANs.value = networksWithVLANs.value || []
  }
  if (hostInternalNetworks.value) {
    reactiveHostInternalNetworks.value = hostInternalNetworks.value || []
  }
})
</script>

<style lang="postcss" scoped>
.pool-network-view {
  border: solid 0.1rem var(--color-neutral-border);
  margin: 0.8rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 4rem;
  }
}
</style>
