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
import { renderV2vTargetCells } from '@/modules/v2v/components/mapping/v2v-target-cells.ts'
import type { V2vNicMappingRow, V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

const { networkOptions, loading } = defineProps<{
  rows: V2vNicMappingRow[]
  networkOptions: V2vTargetOption<FrontXoNetwork['id']>[]
  loading: boolean
}>()

const emit = defineEmits<{
  changeNetwork: [key: V2vNicMappingRow['key'], networkId: FrontXoNetwork['id'] | undefined]
}>()

const useNicMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    adapter: useTextColumn({ headerLabel: () => t('adapter') }),
    portGroup: useTextColumn({ headerLabel: () => t('port-group') }),
    mac: useTextColumn({ headerLabel: () => t('mac-address') }),
    target: useTextColumn({ headerLabel: () => t('target-network') }),
    origin: useTextColumn({ headerLabel: () => t('value-from') }),
  }
})

const { HeadCells, BodyCells } = useNicMappingColumns({
  body: (row: V2vNicMappingRow) => ({
    adapter: renderer => renderer(row.label),
    portGroup: () =>
      renderBodyCell(() => h(InlineParts, () => row.portGroupParts.map(part => h('span', { key: part }, part)))),
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
