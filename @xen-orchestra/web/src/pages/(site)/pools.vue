<template>
  <div class="pools" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <PoolsTable :servers />
    </UiCard>
    <PoolSidePanel :server="selectedServer" @close="selectedServer = undefined" />
  </div>
</template>

<script setup lang="ts">
import PoolSidePanel from '@/modules/pool/components/list/panel/PoolSidePanel.vue'
import PoolsTable from '@/modules/pool/components/list/PoolsTable.vue'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store'

const { servers, getServerById } = useXoServerCollection()
const panelStore = usePanelStore()
const uiStore = useUiStore()

const selectedServer = useRouteQuery<FrontXoServer | undefined>('id', {
  toData: id => getServerById(id as FrontXoServer['id']),
  toQuery: server => server?.id ?? '',
})
</script>

<style scoped lang="postcss">
.pools {
  &.locked:not(.mobile) {
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
