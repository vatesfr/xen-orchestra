<template>
  <div class="pool-network-view">
    <UiCard class="container">
      <PoolNetworksTable />
      <PoolHostInternalNetworksTable />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import PoolHostInternalNetworksTable from '@/components/pool/network/PoolHostInternalNetworksTable.vue'
import PoolNetworksTable from '@/components/pool/network/PoolNetworksTable.vue'
import UiCard from '@/components/ui/UiCard.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))
</script>

<style lang="postcss" scoped>
.pool-network-view {
  display: flex;

  .container {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    margin: 0.8rem;
    border: solid 0.1rem var(--color-neutral-border);
    border-radius: 0.8rem;
  }
}
</style>
