import VtsSelect from '@core/components/select/VtsSelect.vue'
import type { FormSelectId } from '@core/packages/form-select/types.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

export const useSelectColumn = defineColumn((config?: HeaderConfig) => ({
  renderHead: () => renderHeadCell(config?.headerIcon, config?.headerLabel),
  renderBody: (id: FormSelectId) => renderBodyCell(() => h(VtsSelect, { accent: 'brand', id })),
}))
