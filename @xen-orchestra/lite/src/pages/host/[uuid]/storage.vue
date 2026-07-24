<template>
  <VtsContentSidePanel class="host-storage-view" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <StorageRepositoriesTable v-if="pool && host && scope" :srs :pool :scope :busy="!isReady" :error="hasError" />
    </UiCard>
    <StorageRepositorySidePanel
      v-if="pool && host && scope"
      :sr="selectedSr"
      :pool
      :scope
      @close="selectedSr = undefined"
    />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiHost, XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
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

const scope = computed((): SrScope | undefined => {
  if (host.value === undefined) {
    return undefined
  }

  return {
    type: SR_SCOPE_TYPE.HOST,
    hostId: host.value.$ref,
  }
})

const srs = computed((): XenApiSr[] => {
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
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
