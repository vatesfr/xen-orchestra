<template>
  <div class="pools" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <PoolsTable :servers />
    </UiCard>
    <PoolsSidePanel v-if="selectedServer" :server="selectedServer" @close="selectedServer = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsNoSelectionHero type="panel" />
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolsSidePanel from '@/components/site/pools/PoolsSidePanel.vue'
import PoolsTable from '@/components/site/pools/PoolsTable.vue'
import { useServerStore } from '@/stores/xo-rest-api/server.store'
import type { XoServer } from '@/types/xo/server.type'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'

const { records: servers, get } = useServerStore().subscribe()
const uiStore = useUiStore()

const selectedServer = useRouteQuery<XoServer | undefined>('id', {
  toData: id => get(id as XoServer['id']),
  toQuery: server => server?.id ?? '',
})
</script>

<style scoped lang="postcss">
.pools {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
