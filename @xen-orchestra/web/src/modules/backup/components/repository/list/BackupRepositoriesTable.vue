<template>
  <UiTitle>
    {{ t('backup-repositories') }}
    <template #action>
      <slot name="title-actions" />
    </template>
  </UiTitle>
  <UiQuerySearchBar @search="(value: string) => (searchQuery = value)" />

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="user of paginatedUsers" :key="user.id" :selected="selectedBrId === user.id">
        <BodyCells :item="user" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import {
  getBackupReposirotyStatus,
  getBackupRepositoryIcon,
  getBackupRepositoryType,
} from '@/modules/backup/components/utils/xo-backup-repository.utils.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@xen-orchestra/web-core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useRouteQuery } from '@xen-orchestra/web-core/composables/route-query.composable.ts'
import { useTableState } from '@xen-orchestra/web-core/composables/table-state.composable.ts'
import { useBrColumns } from '@xen-orchestra/web-core/tables/column-sets/backup-repository-columns.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs } = defineProps<{
  brs: FrontXoBackupRepository[]
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetProxyById } = useXoProxyCollection()

const searchQuery = ref('')

const filteredUsers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return brs
  }

  return brs.filter(br => Object.values(br).some(value => String(value).toLocaleLowerCase().includes(searchTerm)))
})

const selectedBrId = useRouteQuery('id')

const xo5BrsHref = computed(() => buildXo5Route('/backup/overview'))

const { pageRecords: paginatedUsers, paginationBindings } = usePagination('users', filteredUsers)

const state = useTableState({
  empty: () =>
    brs.length === 0 ? t('no-user-detected') : filteredUsers.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = useBrColumns({
  body: (br: FrontXoBackupRepository) => {
    return {
      backupRepository: r => r({ label: br.name, icon: getBackupRepositoryIcon(br), href: xo5BrsHref.value }),
      status: r => r(getBackupReposirotyStatus(br)),
      type: r => r(getBackupRepositoryType(br.url)),
      proxy: r => {
        const proxyName = useGetProxyById(() => br.proxy).value?.name
        return proxyName ? r(proxyName, { leftIcon: { icon: 'object:instance' } }) : r('')
      },
      usedSpace: r => r(''),
      selectItem: r => r(() => (selectedBrId.value = br.id)),
    }
  },
})
</script>
