<template>
  <div class="host-network-view" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <HostPifsTable :pifs />
    </UiCard>
    <HostPifSidePanel v-if="selectedPif" :pif="selectedPif" @close="selectedPif = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import HostPifSidePanel from '@/components/host/network/HostPifSidePanel.vue'
import HostPifsTable from '@/components/host/network/HostPifsTable.vue'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = usePifStore().subscribe()
const { getByOpaqueRef: getHostOpaqueRef } = useHostStore().subscribe()
const uiStore = useUiStore()

const route = useRoute()

usePageTitleStore().setTitle(useI18n().t('network'))

const pifs = computed(() => {
  return records.value.filter(pif => {
    const host = getHostOpaqueRef(pif.host)

    return host?.uuid === route.params.uuid
  })
})

const selectedPif = useRouteQuery<XenApiPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.uuid === id),
  toQuery: pif => pif?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.host-network-view {
  height: calc(100dvh - 16.5rem);

  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }
}

.container {
  height: fit-content;
  margin: 0.8rem;
  gap: 4rem;
}
</style>
