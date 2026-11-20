import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import type { IconName } from '@core/icons'
import type { FormOption, FormSelectId } from '@core/packages/form-select/types.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h } from 'vue'

type DetailedOption = FormOption<{ icon?: IconName; details?: string }>

export type SelectColumnConfig = HeaderConfig & {
  optionIcon?: IconName | ((option: DetailedOption) => IconName | undefined)
}

function getSelectSlots(optionIcon: SelectColumnConfig['optionIcon']) {
  if (optionIcon === undefined) {
    return undefined
  }

  return {
    default: ({ option }: { option: DetailedOption }) =>
      h(VtsDetailedOption, {
        option,
        icon: typeof optionIcon === 'function' ? optionIcon(option) : optionIcon,
        details: option.properties.details,
      }),
  }
}

export const useSelectColumn = defineColumn((config?: SelectColumnConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (id: FormSelectId) =>
    renderBodyCell(() => h(VtsSelect, { accent: 'brand', id }, getSelectSlots(config?.optionIcon))),
}))
