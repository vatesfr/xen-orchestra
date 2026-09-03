<template>
  <UiTitle>
    {{ t('backup-repositories') }}
    <template #action>
      <UiButton
        variant="primary"
        accent="brand"
        size="medium"
        left-icon="fa:plus"
        @click="openNewBackupRepositoryDrawer()"
      >
        {{ t('new') }}
      </UiButton>
    </template>
  </UiTitle>
  <VtsQueryBuilder v-model="filter" :schema />

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="br of paginatedBrs" :key="br.id" :selected="selectedBrId === br.id">
        <BodyCells :item="br" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useNewBackupRepository } from '@/modules/backup/composables/use-new-backup-repository.composable.ts'
import { useXoBackupRepositoryUtils } from '@/modules/backup/composables/xo-backup-repository-utils.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { parseBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { getBackupRepositoryIcon, getBackupRepositoryStatus } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import VtsQueryBuilder from '@xen-orchestra/web-core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useRouteQuery } from '@xen-orchestra/web-core/composables/route-query.composable.ts'
import { useTableState } from '@xen-orchestra/web-core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@xen-orchestra/web-core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@xen-orchestra/web-core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupRepositoryColumns } from '@xen-orchestra/web-core/tables/column-sets/backup-repository-columns.ts'
import { useStringSchema } from '@xen-orchestra/web-core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs } = defineProps<{
  brs: FrontXoBackupRepository[]
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { useGetProxyById } = useXoProxyCollection()

const { openNewBackupRepositoryDrawer } = useNewBackupRepository()

const { getTypeLabel } = useXoBackupRepositoryUtils()

const { items: filteredBrs, filter } = useQueryBuilderFilter('backup-repositories', () => brs)

const schema = useQueryBuilderSchema<FrontXoBackupRepository>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  url: useStringSchema(t('url')),
})

const selectedBrId = useRouteQuery('id')

const xo5BrsHref = computed(() => buildXo5Route('/settings/remotes'))

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('brs', filteredBrs)

const state = useTableState({
  empty: () =>
    brs.length === 0
      ? t('no-backup-repository-detected')
      : filteredBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useBackupRepositoryColumns({
  body: (br: FrontXoBackupRepository) => {
    const proxy = useGetProxyById(() => br.proxy)
    return {
      backupRepository: r => r({ label: br.name, icon: getBackupRepositoryIcon(br), href: xo5BrsHref.value }),
      status: r => r(getBackupRepositoryStatus(br)),
      type: r => r(getTypeLabel(parseBackupRepositoryUrl(br.url)?.type)),
      proxy: r => (proxy.value ? r(proxy.value.name, { leftIcon: { icon: 'object:proxy' } }) : r('')),
      selectItem: r => r(() => (selectedBrId.value = br.id)),
    }
  },
})
</script>
