<template>
  <div class="host-network-view">
    <UiCard class="container">
      <HostPifTable />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import HostPifTable from '@/components/host/network/HostPifTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))
</script>

<style lang="postcss" scoped>
.host-network-view {
  display: flex;
  border-radius: 0.8rem;

  .container {
    border: solid 0.1rem var(--color-neutral-border);
    margin: 0.8rem;
  }
}
</style>
