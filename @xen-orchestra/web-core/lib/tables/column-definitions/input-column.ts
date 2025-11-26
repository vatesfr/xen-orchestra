import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

type InputConfig = {
  placeholder?: MaybeRefOrGetter<string | undefined>
  type?: MaybeRefOrGetter<InputType | undefined>
}

export const useInputColumn = defineColumn((config?: HeaderConfig & InputConfig) => ({
  renderHead: () =>
    renderHeadCell(
      config?.headerIcon ?? (config?.type === 'number' ? 'fa:hashtag' : 'fa:align-left'),
      config?.headerLabel
    ),
  renderBody: (model: Ref<string | number>) =>
    renderBodyCell(() =>
      h(UiInput, {
        accent: 'brand',
        placeholder: toValue(config?.placeholder),
        type: toValue(config?.type),
        modelValue: toValue(model) ?? '',
        'onUpdate:modelValue': (value: string | number) => {
          model.value = value
        },
      })
    ),
}))
