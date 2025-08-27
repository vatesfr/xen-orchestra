<template>
  <div class="pools" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <PoolsTable :servers />
    </UiCard>
    <PoolsSidePanel v-if="selectedServer" :server="selectedServer" @close="selectedServer = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" image-size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import PoolsSidePanel from '@/components/site/pools/PoolsSidePanel.vue'
import PoolsTable from '@/components/site/pools/PoolsTable.vue'
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoServer } from '@/types/xo/server.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store'
import { useI18n } from 'vue-i18n'

const { servers, getServerById } = useXoServerCollection()
const uiStore = useUiStore()

const selectedServer = useRouteQuery<XoServer | undefined>('id', {
  toData: id => getServerById(id as XoServer['id']),
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
