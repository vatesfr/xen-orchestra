<template>
  <div class="backup-job-target-backup-repository-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

    <VtsTable :state :pagination-bindings :selection-bindings>
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

    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { brs, compatibleBrs, busy, error } = defineProps<{
  brs: FrontXoBackupRepository[]
  compatibleBrs: FrontXoBackupRepository[]
  busy: boolean
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoBackupRepository['id'][]>({ required: true })

const { t } = useI18n()

const {
  items: displayedBrs,
  filter,
  schema,
} = useBackupRepositoryQueryBuilder('backup-job-target-brs', () => brs, { ignoreRoute: true })

const compatibleBrIds = computed(() => new Set(compatibleBrs.map(br => br.id)))

function isCompatible(br: FrontXoBackupRepository) {
  return compatibleBrIds.value.has(br.id)
}

const { pageRecords: paginatedBrs, paginationBindings } = usePagination('backup-job-target-brs', displayedBrs, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => compatibleBrs,
  () => displayedBrs.value.filter(isCompatible),
  () => paginatedBrs.value.filter(isCompatible)
)

const state = useTableState({
  busy: () => busy,
  empty: () =>
    brs.length === 0
      ? t('no-backup-repository-detected')
      : displayedBrs.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const errorMessage = computed(() => formatErrorMessage(error))

const { HeadCells, BodyCells } = useBackupRepositoryColumns({
  exclude: ['proxy', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (br: FrontXoBackupRepository) => {
    const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
    const typeLabel = useXoBackupRepositoryTypeLabel(() => parsedBrUrl.value?.type)

    return {
      checkbox: r =>
        r({ selected: isSelected(br.id), onToggle: () => toggleSelection(br.id), disabled: !isCompatible(br) }),
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
</script>

<style lang="postcss" scoped>
.backup-job-target-backup-repository-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
