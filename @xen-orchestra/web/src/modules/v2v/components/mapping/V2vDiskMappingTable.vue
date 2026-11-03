<template>
  <VtsTable>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="row of rows" :key="row.key">
        <BodyCells :item="row" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { renderV2vTargetCells } from '@/modules/v2v/components/mapping/v2v-target-cells.ts'
import type { V2vDiskMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { renderSizeCell } from '@/shared/utils/size-cell.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

const { srOptions, loading } = defineProps<{
  rows: V2vDiskMappingRow[]
  srOptions: V2vTargetOption<FrontXoSr['id']>[]
  loading: boolean
}>()

const emit = defineEmits<{
  changeSr: [key: V2vDiskMappingRow['key'], srId: FrontXoSr['id'] | undefined]
}>()

const useDiskMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    disk: useTextColumn({ headerLabel: () => t('disk') }),
    datastore: useTextColumn({ headerLabel: () => t('datastore') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    target: useTextColumn({ headerLabel: () => t('target-sr') }),
    origin: useTextColumn({ headerLabel: () => t('value-from') }),
  }
})

const { HeadCells, BodyCells } = useDiskMappingColumns({
  body: (row: V2vDiskMappingRow) => ({
    disk: renderer => renderer(row.label),
    datastore: renderer => renderer(row.datastore),
    size: renderer => renderSizeCell(row.size, renderer),
    ...renderV2vTargetCells(() => ({
      target: row.sr,
      options: srOptions,
      loading,
      onChange: srId => emit('changeSr', row.key, srId),
    })),
  }),
})
</script>
