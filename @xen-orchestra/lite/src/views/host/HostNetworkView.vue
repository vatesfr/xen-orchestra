<template>
  <div class="host-network-view">
    <UiCard class="card">
      <HostPifTable :pifs="pifs" :is-ready @row-select="selectPif" />
    </UiCard>
    <HostPifSidePanel v-if="selectedPif" :pif="selectedPif" />
    <UiPanel v-else class="panel">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import HostPifSidePanel from '@/components/host/network/HostPifSidePanel.vue'
import HostPifTable from '@/components/host/network/HostPifTable.vue'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { currentHostPifs: pifs, isReady } = usePifStore().subscribe()

const selectedPif = ref<XenApiPif>()

const selectPif = (id: XenApiPif['uuid']) => {
  selectedPif.value = pifs.value.find(pif => pif.uuid === id)
}
</script>

<style lang="postcss" scoped>
.host-network-view {
  display: flex;
  border-radius: 0.8rem;

  .card {
    border: solid 0.1rem var(--color-neutral-border);
    margin: 0.8rem;
  }

  .panel {
    border-top: none;
    border-right: none;
  }
}
</style>
