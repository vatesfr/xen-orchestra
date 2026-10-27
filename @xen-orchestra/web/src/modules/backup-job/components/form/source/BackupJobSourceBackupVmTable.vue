<template>
  <div class="backup-job-source-backup-vm-table">
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />

    <VtsTable :state :pagination-bindings :selection-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="vm of paginatedVms" :key="vm.id">
          <BodyCells :item="vm" />
        </VtsRow>
      </tbody>
    </VtsTable>

    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>{{ message }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import { useBackupJobIdSelection } from '@/modules/backup-job/composables/use-backup-job-id-selection.composable.ts'
import {
  type BackupJobMirrorVm,
  useBackupJobMirrorVms,
} from '@/modules/backup-job/composables/use-backup-job-mirror-vms.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupArchiveVmColumns } from '@core/tables/column-sets/backup-archive-vm-columns.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, busy, schema, toPreviewItems, error } = defineProps<{
  vms: BackupJobMirrorVm[]
  busy: boolean
  schema: ReturnType<typeof useBackupJobMirrorVms>['mirrorVmSchema']
  toPreviewItems: ReturnType<typeof useBackupJobMirrorVms>['toPreviewItems']
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoVm['id'][]>('selectedIds', { required: true })

const { t } = useI18n()

const { items: filteredVms, filter } = useQueryBuilderFilter('backup-job-source-backup-vms', () => vms, {
  ignoreRoute: true,
})

const { pageRecords: paginatedVms, paginationBindings } = usePagination('backup-job-source-backup-vms', filteredVms, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => vms,
  filteredVms,
  paginatedVms
)

const state = useTableState({
  busy: () => busy,
  empty: () =>
    vms.length === 0
      ? t('no-vm-backup-on-backup-repository')
      : filteredVms.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

const { HeadCells, BodyCells } = useBackupArchiveVmColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (vm: BackupJobMirrorVm) => {
    const [previewItem] = toPreviewItems([vm])

    return {
      checkbox: r => r({ selected: isSelected(vm.id), onToggle: () => toggleSelection(vm.id) }),
      vm: r => r({ label: vm.name_label, to: previewItem.route, icon: previewItem.icon }),
      backups: r => r(vm.backupCount),
      lastBackupDate: r => r(vm.lastBackupDate),
    }
  },
})
</script>

<style lang="postcss" scoped>
.backup-job-source-backup-vm-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  :deep(.table) {
    width: 100%;
  }

  :deep(th:last-child),
  :deep(td:last-child) {
    white-space: nowrap;
  }
}
</style>
