<template>
  <div class="storage" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :has-error="hasSrFetchError" />
    </UiCard>
    <StorageRepositoriesSidePanel v-if="selectedSr" :sr="selectedSr" @close="selectedSr = undefined" />
    <UiPanel>
      <VtsStateHero format="panel" type="no-selection" size="medium">
        {{ t('select-to-see-details') }}
      </VtsStateHero>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import StorageRepositoriesSidePanel from '@/components/storage-repositories/panel/StorageRepositoriesSidePanel.vue'
import StorageRepositoriesTable from '@/components/storage-repositories/StorageRepositoriesTable.vue'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPool
}>()

const { t } = useI18n()

const { srsByPool, hasSrFetchError, getSrById } = useXoSrCollection()
const uiStore = useUiStore()

const srs = computed(() => srsByPool.value.get(pool.id) ?? [])

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
