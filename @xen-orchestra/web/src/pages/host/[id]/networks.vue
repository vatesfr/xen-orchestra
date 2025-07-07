<template>
  <div class="networks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <HostPifTable :pifs />
    </UiCard>
    <HostPifSidePanel v-if="selectedPif" :pif="selectedPif" @close="selectedPif = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostPifSidePanel from '@/components/host/network/HostPifSidePanel.vue'
import HostPifTable from '@/components/host/network/HostPifTable.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { useArrayFilter } from '@vueuse/shared'
import { useRoute } from 'vue-router/auto'

const { records } = usePifStore().subscribe()
const uiStore = useUiStore()
const route = useRoute<'/host/[id]'>()

const pifs = useArrayFilter(records, pif => pif.$host === route.params.id)

const selectedPif = useRouteQuery<XoPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.id === id),
  toQuery: pif => pif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
