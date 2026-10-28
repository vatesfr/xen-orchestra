<template>
  <UiCard>
    <UiCardTitle>
      <VtsIcon name="fa:lock" size="medium" />
      {{ t('active-mapping') }}
      <template #description>
        <InlineParts>
          <span>{{ t('v2v:locked-since-first-sync') }}</span>
          <span>{{ t('pool-named', { name: poolName }) }}</span>
        </InlineParts>
      </template>
    </UiCardTitle>
    <VtsTable :state horizontal>
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
  </UiCard>
</template>

<script lang="ts" setup>
import type { V2vActiveMappingRow } from '@/modules/v2v/types/v2v-mapping.type.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import { renderInlinePartsCell } from '@/shared/utils/inline-parts-cell.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

const { loading } = defineProps<{
  poolName: string
  rows: V2vActiveMappingRow[]
  loading: boolean
}>()

const { t } = useI18n()

const state = useTableState({ busy: () => loading })

const useActiveMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    source: useTextColumn({ headerLabel: () => t('source') }),
    detail: useTextColumn({ headerLabel: () => t('details') }),
    destination: useTextColumn({ headerLabel: () => t('destination') }),
  }
})

const { HeadCells, BodyCells } = useActiveMappingColumns({
  body: (row: V2vActiveMappingRow) => ({
    source: renderer => renderer(row.source),
    detail: () => renderInlinePartsCell(row.detailParts),
    destination: renderer => renderer(row.destination ?? ''),
  }),
})
</script>
