import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRankCell from '@core/components/table/cells/VtsRankCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue } from 'vue'

const COLUMN_WIDTH = '7rem'

export type RankConfig = {
  highlighted?: boolean
}

export const useRankColumn = defineColumn((config?: HeaderConfig & RankConfig) => ({
  renderHead: () => h(VtsHeaderCell, { style: { width: COLUMN_WIDTH } }, () => toValue(config?.headerLabel)),
  renderBody: (rank: number, shift?: number) =>
    h(VtsRankCell, { rank, shift, highlighted: config?.highlighted, style: { width: COLUMN_WIDTH } }),
}))
