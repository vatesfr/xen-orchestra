<template>
  <VtsNoDataHero v-if="!records.length" type="page" />
  <div v-else class="pools">
    <UiCard v-if="isReady" class="container">
      <PoolsTable :servers="records" />
    </UiCard>
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
    <PoolSidePanel v-if="selectedServer" :server="selectedServer" />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolSidePanel from '@/components/site/pools/poolSidePanel.vue'
import PoolsTable from '@/components/site/pools/PoolsTable.vue'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import type { XoServer } from '@/types/xo/server.type'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { records, isReady, get } = useServerStore().subscribe()

const selectedServer = useRouteQuery<XoServer | undefined>('id', {
  toData: id => get(id as XoServer['id']),
  toQuery: network => network?.id ?? '',
})
</script>

<style lang="postcss" scoped>
.pools {
  display: flex;
}
</style>
