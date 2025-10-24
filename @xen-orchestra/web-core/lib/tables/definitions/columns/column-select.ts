import { defineBodyCellRenderer } from '@core/packages/table'
import type { Ref } from 'vue'

export const SelectBody = defineBodyCellRenderer({
  component: () => import('@core/components/table/body-cells/VtsSelectCell.vue'),
  props: ({
    selectOptions,
    selectModel,
  }: {
    selectOptions: { id: any; label: any; value: any }[]
    selectModel: Ref<any>
  }) => ({
    options: selectOptions,
    modelValue: selectModel.value,
    'onUpdate:modelValue': (value: any) => {
      selectModel.value = value
    },
  }),
})
