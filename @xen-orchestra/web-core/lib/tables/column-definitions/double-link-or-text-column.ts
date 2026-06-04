import VtsDoubleLinkCell, { type VtsDoubleLinkCellProps } from '@core/components/table/cells/VtsDoubleLinkCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import { defineColumn } from '@core/packages/table'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useDoubleLinkOrTextColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:a', config?.headerLabel),
  renderBody: (link: { label: string; codeSnippet?: boolean } & VtsDoubleLinkCellProps) => {
    const { label, codeSnippet, icon, ...doubleLinkCellProps } = link

    if (codeSnippet) {
      return h(VtsTextCell, { leftIcon: icon, codeSnippet: true }, () => label)
    }

    return h(VtsDoubleLinkCell, { icon, ...doubleLinkCellProps }, () => label)
  },
}))
