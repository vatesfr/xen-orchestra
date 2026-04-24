import VtsDoubleLinkCell, { type VtsDoubleLinkCellProps } from '@core/components/table/cells/VtsDoubleLinkCell.vue'
import { defineColumn } from '@core/packages/table'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useDoubleLinkColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:a', config?.headerLabel),
  renderBody: (link: { label: string } & VtsDoubleLinkCellProps) => {
    const { label, ...doubleLinkCellProps } = link

    return h(VtsDoubleLinkCell, doubleLinkCellProps, () => label)
  },
}))
