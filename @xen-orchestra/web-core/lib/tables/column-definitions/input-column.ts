import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import UiInput, { type InputAccent, type InputType } from '@core/components/ui/input/UiInput.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

type InputConfig = {
  placeholder?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<InputType | undefined>
  width?: string
}

export const useInputColumn = defineColumn((config?: HeaderConfig & InputConfig) => ({
  renderHead: () => h(VtsHeaderCell, { style: { width: config?.width } }, () => toValue(config?.headerLabel)),
  renderBody: (
    model: Ref<string | number | undefined>,
    inputProps?: { id?: string; accent?: InputAccent; disabled?: boolean; min?: number }
  ) =>
    renderBodyCell(() =>
      h(UiInput, {
        accent: 'neutral',
        placeholder: toValue(config?.placeholder),
        type: toValue(config?.type),
        ...inputProps,
        style: { minWidth: 0 },
        modelValue: toValue(model),
        'onUpdate:modelValue': (value: string | number | undefined) => {
          model.value = value
        },
      })
    ),
}))
