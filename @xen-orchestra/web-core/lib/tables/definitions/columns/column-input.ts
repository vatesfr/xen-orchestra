import type { InputCellProps } from '@core/components/table/body-cells/VtsInputCell.vue'
import { defineBodyCellRenderer } from '@core/packages/table'
import type { Ref } from 'vue'

export const InputBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsInputCell.vue'),
  props: (
    config: Omit<InputCellProps, 'modelValue' | 'onUpdate:modelValue'> & {
      inputModel: Ref<any>
    }
  ) => {
    const { inputModel, ...props } = config
    return {
      ...props,
      modelValue: inputModel.value,
      'onUpdate:modelValue': (value: any) => {
        inputModel.value = value
      },
    }
  },
})
