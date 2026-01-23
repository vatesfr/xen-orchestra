<template>
  <div class="pools" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <PoolsTable :servers />
    </UiCard>
    <PoolSidePanel v-if="selectedServer" :server="selectedServer" @close="selectedServer = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolSidePanel from '@/modules/pool/components/list/panel/PoolSidePanel.vue'
import PoolsTable from '@/modules/pool/components/list/PoolsTable.vue'
import {
  useXoServerCollection,
  type FrontXoServer,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const { servers, getServerById } = useXoServerCollection()
const uiStore = useUiStore()

const selectedServer = useRouteQuery<FrontXoServer | undefined>('id', {
  toData: id => getServerById(id as FrontXoServer['id']),
  toQuery: server => server?.id ?? '',
})

const { t } = useI18n()
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
