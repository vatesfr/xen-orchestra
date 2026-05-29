<template>
  <VtsContentSidePanel class="pools">
    <UiCard class="container">
      <PoolsTable :servers />
    </UiCard>
    <PoolSidePanel :server="selectedServer" @close="selectedServer = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import PoolSidePanel from '@/modules/pool/components/list/panel/PoolSidePanel.vue'
import PoolsTable from '@/modules/pool/components/list/PoolsTable.vue'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { servers, getServerById } = useXoServerCollection()

const selectedServer = useRouteQuery<FrontXoServer | undefined>('id', {
  toData: id => getServerById(id as FrontXoServer['id']),
  toQuery: server => server?.id ?? '',
})
</script>

<style scoped lang="postcss">
.pools {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
