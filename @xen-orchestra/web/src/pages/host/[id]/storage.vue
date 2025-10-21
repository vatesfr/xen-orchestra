<template>
  <div class="storage" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :has-error="hasSrFetchError" :is-ready />
    </UiCard>
    <StorageRepositoriesSidePanel v-if="selectedSr" :sr="selectedSr" @close="selectedSr = undefined" />
    <UiPanel v-else-if="!uiStore.isMobile">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import StorageRepositoriesSidePanel from '@/components/storage-repositories/panel/StorageRepositoriesSidePanel.vue'
import StorageRepositoriesTable from '@/components/storage-repositories/StorageRepositoriesTable.vue'
import { useXoPbdCollection } from '@/remote-resources/use-xo-pbd-collection'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import type { XoHost, XoSr } from '@vates/types'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { hasSrFetchError, getSrById, areSrsReady } = useXoSrCollection()
const { pbds, arePbdsReady } = useXoPbdCollection()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const uiStore = useUiStore()

const srs = computed(() => {
  return pbds.value
    .reduce<XoSr[]>((acc, pbd) => {
      if (pbd.host === host.id) {
        const sr = getSrById(pbd.SR)

        if (sr !== undefined) {
          acc.push(sr)
        }
      }

      return acc
    }, [])
    .sort((sr1, sr2) => sortByNameLabel(sr1, sr2))
})

const selectedSr = useRouteQuery<XoSr | undefined>('id', {
  toData: id => getSrById(id as XoSr['id']),
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
