import VtsTagCell from '@core/components/table/cells/VtsTagCell.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { h } from 'vue'

export const useTagColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon ?? 'fa:square-caret-down', config?.headerLabel),
  renderBody: (tags?: MaybeArray<string>) => h(VtsTagCell, { tags: toArray(tags) }),
}))
