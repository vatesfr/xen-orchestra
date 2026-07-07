import VtsUserNameCell from '@core/components/table/cells/VtsUserNameCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useUserNameColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (content: string, props?: { href?: string }) => h(VtsUserNameCell, { content, href: props?.href }),
}))
