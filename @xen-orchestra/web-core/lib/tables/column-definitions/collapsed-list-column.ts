import VtsCollapsedListCell from '@core/components/table/cells/VtsCollapsedListCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { h } from 'vue'

export const useCollapsedListColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (items: MaybeArray<string>) => h(VtsCollapsedListCell, { items: toArray(items) }),
}))
