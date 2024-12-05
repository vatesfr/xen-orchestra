<template>
  <div class="host-network-view">
    <PifTable :pifs @row-select="selectPif" />
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

  .panel {
    width: 40rem;
    border-top: none;
  }
}
</style>
