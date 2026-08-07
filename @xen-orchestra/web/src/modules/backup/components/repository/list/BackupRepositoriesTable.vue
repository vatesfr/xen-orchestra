<template>
  <UiTitle>
    {{ t('backup-repositories') }}
    <template #action>
      <slot name="title-actions" />
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
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon, getBackupRepositoryStatus } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupRepositoryColumns } from '@core/tables/column-sets/backup-repository-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import VtsRow from '@xen-orchestra/web-core/components/table/VtsRow.vue'
import VtsTable from '@xen-orchestra/web-core/components/table/VtsTable.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { usePagination } from '@xen-orchestra/web-core/composables/pagination.composable.ts'
import { useRouteQuery } from '@xen-orchestra/web-core/composables/route-query.composable.ts'
import { useTableState } from '@xen-orchestra/web-core/composables/table-state.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs, busy, error } = defineProps<{
  brs: FrontXoBackupRepository[]
  busy: boolean
  error: boolean
}>()

defineSlots<{
  'title-actions'(): any
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()

const { getProxyById } = useXoProxyCollection()

const { items: filteredBrs, filter } = useQueryBuilderFilter('brs', () => brs)

const schema = useQueryBuilderSchema<FrontXoBackupRepository>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  url: useStringSchema(t('url')),
})

const selectedBrId = useRouteQuery('id')

const xo5BrsHref = computed(() => buildXo5Route('/settings/remotes'))

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('brs', filteredBrs)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    brs.length === 0
      ? t('no-backup-repository-detected')
      : filteredBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { HeadCells, BodyCells } = useBackupRepositoryColumns({
  body: (br: FrontXoBackupRepository) => {
    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
    const typeLabel = useXoBackupRepositoryTypeLabel(() => parsedBrUrl.value?.type)

    return {
      backupRepository: r =>
        r({ label: br.name, icon: getBackupRepositoryIcon(br, parsedBrUrl.value?.type), href: xo5BrsHref.value }),
      status: r => r(getBackupRepositoryStatus(br)),
      type: r => r(typeLabel.value),
      proxy: r => {
        const proxyName = getProxyById(br.proxy)?.name

        return proxyName ? r(proxyName, { leftIcon: { icon: 'object:proxy' } }) : r('')
      },
      selectItem: r => r(() => (selectedBrId.value = br.id)),
    }
  },
})
</script>
