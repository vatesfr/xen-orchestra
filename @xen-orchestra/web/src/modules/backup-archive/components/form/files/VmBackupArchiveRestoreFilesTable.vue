<template>
  <VtsTable :state :pagination-bindings :selection-bindings>
    <thead>
      <tr>
        <VtsHeaderCell class="checkbox-cell">
          <UiCheckbox v-model="pageSelectionModel" accent="brand" :aria-label="t('select-everything-on-this-page')" />
        </VtsHeaderCell>
        <VtsHeaderCell>{{ t('name') }}</VtsHeaderCell>
        <VtsHeaderCell>{{ t('size') }}</VtsHeaderCell>
        <VtsHeaderCell>{{ t('modified') }}</VtsHeaderCell>
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="row of pageRows" :key="row.path" :selected="getState(row).checked">
        <UiTableCell class="checkbox-cell">
          <UiCheckbox
            :model-value="getCheckboxModel(row)"
            accent="brand"
            :disabled="getState(row).inherited"
            :aria-label="t('select-name', { name: row.name })"
            @update:model-value="toggle(row)"
          />
        </UiTableCell>
        <UiTableCell>
          <div class="name">
            <UiButton
              v-if="row.isDirectory"
              variant="tertiary"
              accent="brand"
              size="small"
              left-icon="fa:folder-closed"
              @click="emit('open', row)"
            >
              {{ row.name }}
            </UiButton>
            <template v-else>
              <VtsIcon name="fa:file" size="medium" />
              <span>{{ row.name }}</span>
            </template>
            <UiTag v-if="getState(row).inherited" accent="muted" variant="secondary">{{ t('with-folder') }}</UiTag>
            <UiTag v-else-if="getState(row).partial" accent="muted" variant="secondary">
              {{ t('n-selected-inside', { n: getState(row).insideCount }) }}
            </UiTag>
          </div>
        </UiTableCell>
        <UiTableCell>{{ row.size === undefined ? '' : formatSize(row.size, 1) }}</UiTableCell>
        <UiTableCell />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import {
  type BackupArchiveFileRow,
  useBackupArchiveFilesSelection,
} from '@/modules/backup-archive/composables/use-backup-archive-files-selection.composable.ts'
import type { BackupArchiveSelectedItem } from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { rows, busy, error } = defineProps<{
  rows: BackupArchiveFileRow[]
  busy: boolean
  error: boolean
}>()

const emit = defineEmits<{
  open: [row: BackupArchiveFileRow]
}>()

const selection = defineModel<BackupArchiveSelectedItem[]>({ required: true })

const { t } = useI18n()

const {
  pageRecords: pageRows,
  paginationBindings,
  goToFirstPage,
} = usePagination('vm-backup-archive-restore-files', () => rows, { ignoreRoute: true })

watch(
  () => rows,
  () => goToFirstPage()
)

const { getState, toggle, pageSelectionModel, selectionBindings } = useBackupArchiveFilesSelection(
  selection,
  () => rows,
  pageRows
)

function getCheckboxModel(row: BackupArchiveFileRow) {
  const { checked, partial } = getState(row)

  if (checked) {
    return true
  }

  return partial ? undefined : false
}

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (rows.length === 0 ? t('this-folder-is-empty') : false),
})
</script>

<style lang="postcss" scoped>
.checkbox-cell {
  width: 4rem;
}

.name {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
