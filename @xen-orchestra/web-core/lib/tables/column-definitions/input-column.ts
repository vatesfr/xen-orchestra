import UiInput, { type InputType } from '@core/components/ui/input/UiInput.vue'
import { defineColumn } from '@core/packages/table/define-column'
import { renderUiTableCell } from '@core/tables/helpers/render-ui-table-cell'
import { renderVtsHeaderCell } from '@core/tables/helpers/render-vts-header-cell'
import type { HeaderConfig } from '@core/tables/types.ts'
import { h, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export const useInputColumn = defineColumn(
  (config?: HeaderConfig & { placeholder?: MaybeRefOrGetter<string>; type?: MaybeRefOrGetter<InputType> }) => ({
    renderHead: () =>
      renderVtsHeaderCell(
        config?.headerIcon ?? (config?.type === 'number' ? 'fa:hashtag' : 'fa:align-left'),
        config?.headerLabel
      ),
    renderBody: (model: Ref<string | number | undefined>) =>
      renderUiTableCell(() =>
        h(UiInput, {
          accent: 'brand',
          placeholder: toValue(config?.placeholder),
          type: toValue(config?.type),
          modelValue: toValue(model) ?? '',
          'onUpdate:modelValue': (value: string | number | undefined) => {
            model.value = value
          },
        })
      ),
  })
)
