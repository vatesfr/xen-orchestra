<template>
  <div class="pools">
    <UiCard class="pools-table">
      <PoolsTable :servers />
    </UiCard>
    <PoolSidePanel v-if="selectedServer" :server="selectedServer" />
    <UiPanel v-else>
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolSidePanel from '@/components/site/pools/PoolSidePanel.vue'
import PoolsTable from '@/components/site/pools/PoolsTable.vue'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import type { XoServer } from '@/types/xo/server.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { records: servers, get } = useServerStore().subscribe()

const selectedServer = useRouteQuery<XoServer | undefined>('id', {
  toData: id => get(id as XoServer['id']),
  toQuery: server => server?.id ?? '',
})
</script>

<style scoped lang="postcss">
.pools {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40rem;

  .pools-table {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
