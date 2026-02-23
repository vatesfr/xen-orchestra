<template>
  <div class="storage" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :busy="!isReady" :error="hasSrFetchError" />
    </UiCard>
    <StorageRepositorySidePanel v-if="selectedSr" :sr="selectedSr" @close="selectedSr = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const { hasSrFetchError, getSrById, areSrsReady } = useXoSrCollection()
const { pbdsByHost, arePbdsReady } = useXoPbdCollection()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const uiStore = useUiStore()

const srs = computed(() => {
  const hostPbds = pbdsByHost.value.get(host.id) ?? []

  return hostPbds
    .reduce<FrontXoSr[]>((acc, pbd) => {
      const sr = getSrById(pbd.SR)

      if (sr !== undefined) {
        acc.push(sr)
      }

      return acc
    }, [])
    .sort((sr1, sr2) => sortByNameLabel(sr1, sr2))
})

const selectedSr = useRouteQuery<FrontXoSr | undefined>('id', {
  toData: id => getSrById(id as FrontXoSr['id']),
  toQuery: sr => sr?.id ?? '',
})
</script>

<style scoped lang="postcss">
.storage {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 40rem;
  }

  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
