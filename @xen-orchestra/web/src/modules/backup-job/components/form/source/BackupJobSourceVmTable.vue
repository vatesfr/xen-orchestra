<template>
  <div class="backup-job-source-vm-table">
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
import type { VmFilterableData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVmColumns } from '@core/tables/column-sets/vm-columns.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vms, error } = defineProps<{
  vms: FrontXoVm[]
  error?: InputWrapperMessage
}>()

const selectedIds = defineModel<FrontXoVm['id'][]>('selectedIds', { required: true })

const { t } = useI18n()

const {
  items: filteredVms,
  filter,
  schema,
  getDisplayData,
} = useVmQueryBuilder('backup-job-source-vms', () => vms, { ignoreRoute: true })

const { pageRecords: paginatedVms, paginationBindings } = usePagination('backup-job-source-vms', filteredVms, {
  ignoreRoute: true,
})

const { isSelected, toggleSelection, pageSelectionModel, selectionBindings } = useBackupJobIdSelection(
  selectedIds,
  () => vms,
  filteredVms,
  paginatedVms
)

const state = useTableState({
  empty: () =>
    vms.length === 0 ? t('no-vm-detected') : filteredVms.value.length === 0 ? { type: 'no-result' } : false,
})

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

const { HeadCells, BodyCells } = useVmColumns({
  exclude: ['ipAddresses', 'vcpus', 'ram', 'diskSpace', 'actions'],
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (vm: VmFilterableData) => ({
    checkbox: r => r({ selected: isSelected(vm.id), onToggle: () => toggleSelection(vm.id) }),
    vm: r => r({ label: vm.name_label, to: `/vm/${vm.id}/dashboard`, icon: getDisplayData(vm).vmIcon }),
    tags: r => r(vm.tags),
  }),
})
</script>

<style lang="postcss" scoped>
.backup-job-source-vm-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
