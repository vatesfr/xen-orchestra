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
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import { renderInlinePartsCell } from '@/modules/v2v/utils/v2v-inline-parts-cell.util.ts'
import { renderV2vTargetCells } from '@/modules/v2v/utils/v2v-target-cells.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { useV2vNicMappingColumns } from '@core/tables/column-sets/v2v-nic-mapping-columns.ts'

const { networkOptions, loading } = defineProps<{
  rows: V2vNicMappingRow[]
  networkOptions: V2vTargetOption<FrontXoNetwork['id']>[]
  loading: boolean
}>()

const emit = defineEmits<{
  changeNetwork: [key: V2vNicMappingRow['key'], networkId: FrontXoNetwork['id'] | undefined]
}>()

const { HeadCells, BodyCells } = useV2vNicMappingColumns({
  body: (row: V2vNicMappingRow) => ({
    adapter: renderer => renderer(row.label),
    portGroup: () => renderInlinePartsCell(row.portGroupParts),
    mac: renderer => renderer(row.macAddress),
    ...renderV2vTargetCells(() => ({
      target: row.network,
      options: networkOptions,
      loading,
      onChange: networkId => emit('changeNetwork', row.key, networkId),
    })),
  }),
})
</script>
