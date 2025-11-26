import VtsSelect from '@core/components/select/VtsSelect.vue'
import type { FormSelectId } from '@core/packages/form-select/types.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell.ts'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useSelectColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderVtsHeaderCell(config?.headerIcon, config?.headerLabel),
  renderBody: (id: FormSelectId) => renderUiTableCell(() => h(VtsSelect, { accent: 'brand', id })),
}))
