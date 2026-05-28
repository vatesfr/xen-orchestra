<template>
  <div class="host-storage-view" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <StorageRepositoriesTable v-if="pool" :srs :pool :busy="!isReady" :error="hasError" />
    </UiCard>
    <StorageRepositorySidePanel v-if="selectedSr && pool" :sr="selectedSr" :pool @close="selectedSr = undefined" />
    <UiPanel v-else-if="!uiStore.isSmall">
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiHost, XenApiSr } from '@/libs/xen-api/xen-api.types'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePbdStore } from '@/stores/xen-api/pbd.store'
import { usePoolStore } from '@/stores/xen-api/pool.store'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

usePageTitleStore().setTitle(t('storage'))

const route = useRoute<'/host/[uuid]/storage'>()

const { getByUuid: getHostByUuid } = useHostStore().subscribe()
const { getByOpaqueRef: getSrByOpaqueRef, isReady: areSrsReady, hasError } = useSrStore().subscribe()
const { getPbdsForHost, isReady: arePbdsReady } = usePbdStore().subscribe()
const { pool } = usePoolStore().subscribe()
const uiStore = useUiStore()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const host = computed(() => getHostByUuid(route.params.uuid as XenApiHost['uuid']))

const srs = computed(() => {
  if (host.value === undefined) {
    return []
  }

  const hostPbds = getPbdsForHost(host.value.$ref)

  return hostPbds
    .reduce<XenApiSr[]>((acc, pbd) => {
      const sr = getSrByOpaqueRef(pbd.SR)

      if (sr !== undefined) {
        acc.push(sr)
      }

      return acc
    }, [])
    .sort(sortByNameLabel)
})

const selectedSr = useRouteQuery<XenApiSr | undefined>('id', {
  toData: id => srs.value.find(sr => sr.uuid === id),
  toQuery: sr => sr?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.host-storage-view {
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
