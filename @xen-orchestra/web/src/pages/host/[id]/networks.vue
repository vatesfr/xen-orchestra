<template>
  <div class="networks">
    <UiCard class="card">
      <HostPifsTable :pifs :selected-row-id="selectedPifRowId" @row-select="selectPif" />
    </UiCard>

    <HostPifsSidePanel v-if="selectedPif" :pif="selectedPif" />
    <UiPanel v-else class="panel">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import HostPifsSidePanel from '@/components/host/HostPifsSidePanel.vue'
import HostPifsTable from '@/components/host/HostPifsTable.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'/host/[id]/network'>()

const { pifsByHost } = usePifStore().subscribe()
const pifs = computed(() => pifsByHost.value.get(route.params.id) ?? [])

const selectedPif = ref<XoPif | null>(null)
const selectedPifRowId = ref<string | null>(null)

const highLightedPifId = useRouteQuery('id')

const selectPif = (id: XoPif['id']) => {
  highLightedPifId.value = id
  selectedPif.value = pifs.value.find(pif => pif.id === id) || null
}
watchEffect(() => {
  if (highLightedPifId.value && pifs.value.length > 0) {
    selectedPif.value = null
    selectedPifRowId.value = null
    const selected = pifs.value.find(pif => pif.id === highLightedPifId.value)
    if (selected) {
      selectedPif.value = selected
      if (pifs.value.includes(selected)) {
        selectedPifRowId.value = selected.id
      }
    }
  }
})
</script>

<style scoped lang="postcss">
.networks {
  display: flex;
  height: 100%;

  .card {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4rem;
    margin: 0.8rem;
    border: solid 0.1rem var(--color-neutral-border);
    border-radius: 0.8rem;
    overflow: hidden;
  }

  .panel {
    width: 40rem;
    border-top: none;
  }
}
</style>
