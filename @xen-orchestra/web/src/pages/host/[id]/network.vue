<template>
  <div class="host-network-view">
    <UiCard class="card">
      <PifTable :pifs @row-select="selectPif" />
    </UiCard>

    <PifPanel v-if="selectedPif" :pif="selectedPif" />
    <UiPanel v-else class="panel">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PifPanel from '@/components/pif/PifPanel.vue'
import PifTable from '@/components/pif/PifTable.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute<'/host/[id]/network'>()

const { pifsByHost } = usePifStore().subscribe()
const pifs = computed(() => pifsByHost.value.get(route.params.id) ?? [])

const selectedPif = ref<XoPif>()

const selectPif = (id: XoPif['id']) => {
  selectedPif.value = pifs.value.find(pif => pif.id === id)
}
</script>

<style scoped lang="postcss">
.host-network-view {
  display: flex;
  height: 100%;

  .card {
    display: flex;
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
