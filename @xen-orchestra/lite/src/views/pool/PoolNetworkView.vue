<template>
  <UiCard class="pool-network-view">
    <div class="content">
      <PoolNetworksTable :networks="networksWithPifs" :is-ready :has-error />
      <PoolHostInternalNetworkTable :networks="networksWithoutPifs" :is-ready :has-error />
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworkTable from '@/components/pool/network/PoolHostInternalNetworkTable.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { networksWithPifs, networksWithoutPifs, isReady, hasError } = useNetworkStore().subscribe()
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
