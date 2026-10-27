<template>
  <div class="backup-job-target-backup-repository-table">
    <VtsQueryBuilder :model-value="query" :schema @search="search($event)" />

    <VtsTable :state :pagination-bindings :selection-bindings="isManual ? selectionBindings : undefined">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="br of paginatedBrs" :key="br.id">
          <BodyCells :item="br" />
        </VtsRow>
      </tbody>
    </VtsTable>

    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>{{ message }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import { useBackupRepositoryQueryBuilder } from '@/modules/backup-repository/composables/use-backup-repository-query-builder.composable.ts'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryTypeLabel } from '@/modules/backup-repository/composables/use-xo-backup-repository-type-label.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useBackupRepositoryColumns } from '@core/tables/column-sets/backup-repository-columns.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { mode, brs, matchedBrs, error } = defineProps<{
  mode: 'manual' | 'smart'
  brs: FrontXoBackupRepository[]
  matchedBrs?: FrontXoBackupRepository[]
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoBackupRepository['id'][]>('selectedIds', { required: true })

const filter = defineModel<string>('filter', { required: true })

const { t } = useI18n()

const isManual = computed(() => mode === 'manual')

const {
  items: searchedBrs,
  filter: searchFilter,
  schema,
} = useBackupRepositoryQueryBuilder('backup-job-target-brs', () => brs, { ignoreRoute: true })

const query = computed(() => (isManual.value ? searchFilter.value : filter.value))

const displayedBrs = computed(() => (isManual.value ? searchedBrs.value : (matchedBrs ?? [])))

function search(value: string) {
  if (isManual.value) {
    searchFilter.value = value
  } else {
    filter.value = value
  }
}

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('backup-job-target-brs', displayedBrs, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => brs,
  displayedBrs,
  paginatedBrs
)

const state = useTableState({
  empty: () =>
    brs.length === 0
      ? t('no-backup-repository-detected')
      : displayedBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

const { HeadCells, BodyCells, toggle } = useBackupRepositoryColumns({
  exclude: ['proxy', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (br: FrontXoBackupRepository) => {
    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
    const typeLabel = useXoBackupRepositoryTypeLabel(() => parsedBrUrl.value?.type)

    return {
      checkbox: r => r({ selected: isSelected(br.id), onToggle: () => toggleSelection(br.id) }),
      backupRepository: r =>
        r({
          label: br.name,
          to: { name: '/admin/backup-repository/[id]/general', params: { id: br.id } },
          icon: getBackupRepositoryIcon(br, parsedBrUrl.value?.type),
        }),
      status: r => r(getBackupRepositoryStatus(br)),
      type: r => r(typeLabel.value),
    }
  },
})

if (mode === 'smart') {
  toggle('checkbox', false)
}
</script>

<style lang="postcss" scoped>
.backup-job-target-backup-repository-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
