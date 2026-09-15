import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

type InputConfig = {
  placeholder?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<InputType | undefined>
}

export const useInputColumn = defineColumn((config?: HeaderConfig & InputConfig) => ({
  renderHead: () => renderHeadCell(config?.headerLabel),
  renderBody: (model: Ref<string | number | undefined>, inputProps?: { disabled?: boolean }) =>
    renderBodyCell(() =>
      h(UiInput, {
        accent: 'brand',
        placeholder: toValue(config?.placeholder),
        type: toValue(config?.type),
        ...inputProps,
        modelValue: toValue(model),
        'onUpdate:modelValue': (value: string | number | undefined) => {
          model.value = value
        },
      })
    ),
}))
