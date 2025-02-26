<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifTable :pifs />
    </UiCard>
    <HostPifSidePanel v-if="selectedPif" :pif="selectedPif" />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostPifSidePanel from '@/components/host/HostPifSidePanel.vue'
import HostPifTable from '@/components/host/HostPifTable.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const { records } = usePifStore().subscribe()
const route = useRoute()

const pifs = computed(() => {
  return records.value.filter(pif => {
    return pif.$host === route.params.id
  })
})

const selectedPif = useRouteQuery<XoPif | undefined>('id', {
  toData: id => pifs.value.find(pif => pif.id === id),
  toQuery: pif => pif?.id ?? '',
})
</script>

<style scoped lang="postcss">
.networks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;
  height: 100%;
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
