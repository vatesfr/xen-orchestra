<template>
  <VtsContentSidePanel class="storage">
    <UiCard class="container">
      <StorageRepositoriesTable :srs :busy="!isReady" :error="hasSrFetchError" :scope>
        <template #title-actions>
          <MenuList placement="bottom-end">
            <template #trigger="{ open }">
              <UiDropdownButton @click="open($event)">{{ t('new') }}</UiDropdownButton>
            </template>
            <MenuItem icon="fa:plus" @click="openCreateSrDrawer({ poolId: host.$pool, hostId: host.id })">
              {{ t('action:create-sr') }}
            </MenuItem>
          </MenuList>
        </template>
      </StorageRepositoriesTable>
    </UiCard>
    <StorageRepositorySidePanel :sr="selectedSr" :scope @close="selectedSr = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import StorageRepositorySidePanel from '@/modules/storage-repository/components/list/panel/StorageRepositorySidePanel.vue'
import StorageRepositoriesTable from '@/modules/storage-repository/components/list/StorageRepositoriesTable.vue'
import { useCreateSrDrawer } from '@/modules/storage-repository/composables/use-create-sr-drawer.composable.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
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

const scope: SrScope = { type: SR_SCOPE_TYPE.HOST, hostId: host.id }

const { openCreateSrDrawer } = useCreateSrDrawer()
</script>

<style scoped lang="postcss">
.storage {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
