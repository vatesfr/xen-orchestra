<template>
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
</template>

<script lang="ts" setup>
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useVmDeletionColumns } from '@core/tables/column-sets/vm-deletion-columns.ts'
import { useI18n } from 'vue-i18n'

const { vms } = defineProps<{
  vms: FrontXoVm[]
}>()

const { t } = useI18n()

const state = useTableState({
  empty: () => (vms.length === 0 ? t('no-vm-detected') : false),
})

const { pageRecords: paginatedVms, paginationBindings } = usePagination('vm-partial-deletion', () => vms, {
  ignoreRoute: true,
})

const { HeadCells, BodyCells } = useVmDeletionColumns({
  body: (vm: FrontXoVm) => ({
    vm: r =>
      r({ label: vm.name_label, to: { name: '/vm/[id]/dashboard', params: { id: vm.id } }, icon: getVmIcon(vm) }),
  }),
})
</script>
