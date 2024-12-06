<template>
  <UiCard class="host-network-view">
    <HostPifTable :pifs="pifs" :is-ready />
  </UiCard>
</template>

<script lang="ts" setup>
import HostPifTable from '@/components/host/network/HostPifTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { currentHostPifs: pifs, isReady } = usePifStore().subscribe()
</script>

<style lang="postcss" scoped>
.host-network-view {
  border: solid 0.1rem var(--color-neutral-border);
  margin: 0.8rem;
}
</style>
