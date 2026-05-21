<template>
  <div class="storage" :class="{ mobile: uiStore.isSmall, locked: panelStore.isLocked && !uiStore.isSmall }">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :busy="!isReady" :error="hasSrFetchError" :scope />
    </UiCard>
    <StorageRepositorySidePanel :sr="selectedSr" :scope @close="selectedSr = undefined" />
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
import type { StorageScope } from '@/modules/storage-repository/types/storage-scope.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { usePanelStore } from '@core/stores/panel.store'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { hasSrFetchError, getSrById, areSrsReady } = useXoSrCollection()
const { pbdsByHost, arePbdsReady } = useXoPbdCollection()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const panelStore = usePanelStore()
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

const scope: StorageScope = { type: 'host', hostId: host.id }
</script>

<style scoped lang="postcss">
.storage {
  &.locked:not(.mobile) {
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
