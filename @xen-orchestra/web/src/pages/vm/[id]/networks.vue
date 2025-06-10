<template>
  <div class="networks" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <VmVifsTable :vifs />
    </UiCard>
    <VmVifSidePanel v-if="selectedVif" :vif="selectedVif" @close="selectedVif = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import VmVifSidePanel from '@/components/vm/network/VmVifSidePanel.vue'
import VmVifsTable from '@/components/vm/network/VmVifsTable.vue'
import { useVifStore } from '@/stores/xo-rest-api/vif.store.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useArrayFilter } from '@vueuse/shared'
import { useRoute } from 'vue-router/auto'

const { records } = useVifStore().subscribe()
const uiStore = useUiStore()

const route = useRoute<'/vm/[id]'>()

const vifs = useArrayFilter(records, vif => vif.$VM === route.params.id)

const selectedVif = useRouteQuery<XoVif | undefined>('id', {
  toData: id => vifs.value.find(vif => vif.id === id),
  toQuery: vif => vif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  height: 100%;

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
