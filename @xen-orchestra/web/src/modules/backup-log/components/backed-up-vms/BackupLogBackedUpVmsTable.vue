<template>
  <div class="backup-log-backed-up-vms-table">
    <UiTitle>
      {{ t('backed-up-vms') }}
    </UiTitle>
    <VtsQueryBuilder :model-value="filter" :schema @search="filter = $event" />
    <VtsTable :state :pagination-bindings>
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
  </div>
</template>

<script setup lang="ts">
import { useXoBackupLogTaskName } from '@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'
import { useXoBackupLogsUtils } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { BackupLogVmFilterableData } from '@/modules/backup-log/types/xo-backup-log.type.ts'
import { getBackupLogVmTasks } from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

const { getTaskName } = useXoBackupLogTaskName()

const { findVmTransfer } = useXoBackupLogsUtils()

const vms = computed(() =>
  getBackupLogVmTasks(backupLog).map(vmTask => {
    const id = vmTask.data?.id as FrontXoVm['id']
    const { name, icon, to } = getTaskName(vmTask)

    return {
      id,
      name: name ?? id,
      icon,
      to,
      size: findVmTransfer(vmTask)?.size,
    }
  })
)

const { items: filteredVms, filter } = useQueryBuilderFilter<BackupLogVmFilterableData>(
  'backup-log-vms',
  () => vms.value
)

const schema = useQueryBuilderSchema<BackupLogVmFilterableData>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('vm')),
})

const { pageRecords: paginatedVms, paginationBindings } = usePagination('backup-log-vms', filteredVms)

const state = useTableState({
  empty: () =>
    vms.value.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['checkbox', 'ipAddresses', 'vcpus', 'ram', 'tags', 'actions'],
  body: (vm: BackupLogVmFilterableData) => {
    const size = computed(() => formatSizeRaw(vm.size, 2))

    return {
      vm: r => r({ label: vm.name, to: vm.to, icon: vm.icon }),
      diskSpace: r => r(size.value?.value, size.value?.prefix),
    }
  },
})
</script>

<style scoped lang="postcss">
.backup-log-backed-up-vms-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
