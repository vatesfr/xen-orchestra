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
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { BackupLogVmFilterableData } from '@/modules/backup-log/types/xo-backup-log.type.ts'
import { getBackupLogVmTasks } from '@/modules/backup-log/utils/xo-backup-log.util.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { objectIcon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useBackupLogVmColumns } from '@core/tables/column-sets/backup-log-vm-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupLog } = defineProps<{
  backupLog: FrontXoBackupLog
}>()

const { t } = useI18n()

const { getVmById } = useXoVmCollection()

const { getVbdsByIds } = useXoVbdCollection()

const { getVdiById } = useXoVdiCollection()

function getVmVirtualSize(vm: FrontXoVm | undefined) {
  if (vm === undefined) {
    return undefined
  }

  return getVbdsByIds(vm.$VBDs)
    .filter(vbd => !vbd.is_cd_drive)
    .reduce((totalSize, vbd) => totalSize + (getVdiById(vbd.VDI as FrontXoVdi['id'])?.size ?? 0), 0)
}

const vms = computed(() =>
  getBackupLogVmTasks(backupLog).map(vmTask => {
    const id = vmTask.data?.id as FrontXoVm['id']
    const vm = getVmById(id)

    return {
      id,
      name: vm?.name_label ?? vmTask.data?.name_label ?? id,
      size: getVmVirtualSize(vm),
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

const { HeadCells, BodyCells } = useBackupLogVmColumns({
  body: (vm: BackupLogVmFilterableData) => {
    const xoVm = computed(() => getVmById(vm.id))

    const size = computed(() => formatSizeRaw(vm.size, 2))

    return {
      vm: r =>
        xoVm.value !== undefined
          ? r({
              label: vm.name,
              to: { name: '/vm/[id]/dashboard', params: { id: vm.id } },
              icon: objectIcon('vm', toLower(xoVm.value.power_state)),
            })
          : r({ label: vm.name }),
      virtualSize: r => r(size.value?.value, size.value?.prefix),
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
