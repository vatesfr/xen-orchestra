<template>
  <VtsContentSidePanel class="pool-storage-view" :class="{ mobile: uiStore.isSmall }">
    <UiCard class="container">
      <StorageRepositoriesTable v-if="pool" :srs="sortedSrs" :pool :busy="!isReady" :error="hasError" />
    </UiCard>
    <StorageRepositorySidePanel v-if="pool" :sr="selectedSr" :pool @close="selectedSr = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

usePageTitleStore().setTitle(t('storage'))

const { pool } = usePoolStore().subscribe()
const { records: srs, isReady: areSrsReady, hasError } = useSrStore().subscribe()
const { isReady: arePbdsReady } = usePbdStore().subscribe()
const uiStore = useUiStore()

const isReady = logicAnd(areSrsReady, arePbdsReady)

const sortedSrs = computed(() => [...srs.value].sort(sortByNameLabel))

const selectedSr = useRouteQuery<XenApiSr | undefined>('id', {
  toData: id => sortedSrs.value.find(sr => sr.uuid === id),
  toQuery: sr => sr?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.pool-storage-view {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
