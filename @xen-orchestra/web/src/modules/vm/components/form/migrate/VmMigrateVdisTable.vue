<template>
  <div class="vm-migrate-vdis-table">
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row in paginatedRows" :key="row.vdi.id" :error="showErrors && flaggedVdiIds.has(row.vdi.id)">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
    <VtsFlagLegend v-if="flaggedRows.length > 0">{{ t('vdis-must-be-migrated') }}</VtsFlagLegend>
    <VtsErrorList v-if="showErrors && flaggedRows.length > 0">
      <li v-for="row in flaggedRows" :key="row.vdi.id">
        {{ t('vdi-destination-sr-required', { name: row.vdi.name_label }) }}
      </li>
    </VtsErrorList>
  </div>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { VmMigrateVdiRow } from '@/modules/vm/form/migrate/use-vm-migrate-mapping-form.ts'
import VtsErrorList from '@core/components/error-list/VtsErrorList.vue'
import VtsFlagLegend from '@core/components/table/VtsFlagLegend.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useFormSelect } from '@core/packages/form-select'
import { useVmMigrateVdiColumns } from '@core/tables/column-sets/vm-migrate-vdi-columns.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { rows, srs, flaggedRows } = defineProps<{
  rows: VmMigrateVdiRow[]
  srs: FrontXoSr[]
  flaggedRows: VmMigrateVdiRow[]
  showErrors: boolean
}>()

const emit = defineEmits<{
  selectSr: [vdiId: VmMigrateVdiRow['vdi']['id'], srId: FrontXoSr['id'] | undefined]
}>()

const { t } = useI18n()

const { getVbdsByIds } = useXoVbdCollection()
const { getSrSelectLabel } = useXoSrUtils()

const state = useTableState({
  empty: () => (rows.length === 0 ? t('no-vdi-detected') : false),
})

const { pageRecords: paginatedRows, paginationBindings } = usePagination('vm-migrate-vdis', () => rows, {
  ignoreRoute: true,
})

const flaggedVdiIds = computed(() => new Set(flaggedRows.map(row => row.vdi.id)))

const { HeadCells, BodyCells } = useVmMigrateVdiColumns({
  body: (row: VmMigrateVdiRow) => {
    const targetSrId = computed({
      get: () => row.targetSrId,
      set: srId => emit('selectSr', row.vdi.id, srId),
    })

    const { id: srSelectId } = useFormSelect(() => srs, {
      model: targetSrId,
      searchable: true,
      placeholder: () => t('action:select-storage'),
      option: {
        label: sr => getSrSelectLabel(sr),
        value: 'id',
      },
    })

    const usedSpace = formatSizeRaw(row.vdi.usage, 2)
    const sourceSrName = row.sourceSr?.name_label ?? ''

    return {
      vdi: r => r(row.vdi.name_label, { leftIcon: { icon: getVdiIcon(getVbdsByIds(row.vdi.$VBDs)) } }),
      usedSpace: r => r(usedSpace.value, usedSpace.prefix),
      fromSr: r => r(sourceSrName),
      toSr: r => r(srSelectId),
      flag: r => r(flaggedVdiIds.value.has(row.vdi.id)),
    }
  },
})
</script>

<style lang="postcss" scoped>
.vm-migrate-vdis-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
