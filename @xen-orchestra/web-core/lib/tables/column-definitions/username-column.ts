import VtsUsernameCell from '@core/components/table/cells/VtsUsernameCell.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useUsernameColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (content: string, link?: Pick<LinkOptions, 'to' | 'href'>) => h(VtsUsernameCell, { content, ...link }),
}))
