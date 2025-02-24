<template>
  <div class="networks">
    <UiCard class="container">
      <HostPifTable :pifs />
    </UiCard>
    <HostPifSidePanel v-if="pif" :pif />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostPifSidePanel from '@/components/host/HostPifSidePanel.vue'
import HostPifTable from '@/components/host/HostPifTable.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const { records } = usePifStore().subscribe()

const pifId = useRouteQuery('id')
const route = useRoute()

const hostId = route.params.id as XoHost['id']
const pifs = computed(() => {
  return records.value.filter(pif => {
    return pif.$host === hostId
  })
})

const pif = computed(() => records.value.find(pif => pif.id === pifId.value))
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
