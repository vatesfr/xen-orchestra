<template>
  <VtsNoDataHero v-if="!records.length" type="page" />
  <div v-else class="pools">
    <UiCard v-if="true" class="container">
      <PoolsTable :servers="records" />
    </UiCard>
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolsTable from '@/components/site/pools/PoolsTable.vue'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'

const { records } = useServerStore().subscribe()
</script>
