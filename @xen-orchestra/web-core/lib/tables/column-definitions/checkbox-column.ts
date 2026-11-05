import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { h, type Ref } from 'vue'

const COLUMN_WIDTH = '4rem'

export type CheckboxCellBindings = {
  selected: boolean
  onToggle: () => void
}

function renderHeadCheckbox(model: Ref<boolean | undefined>) {
  return h(UiCheckbox, {
    accent: 'brand',
    modelValue: model.value,
    'onUpdate:modelValue': (value: boolean | undefined | string[]) => {
      model.value = value === true
    },
  })
}

function renderBodyCheckbox({ selected, onToggle }: CheckboxCellBindings) {
  return h(UiCheckbox, {
    accent: 'brand',
    modelValue: selected,
    'onUpdate:modelValue': onToggle,
  })
}

export const useCheckboxColumn = defineColumn(() => ({
  renderHead: (model: Ref<boolean | undefined>) =>
    h(VtsHeaderCell, { style: { width: COLUMN_WIDTH } }, () => renderHeadCheckbox(model)),
  renderBody: (bindings: CheckboxCellBindings) =>
    h(UiTableCell, { style: { width: COLUMN_WIDTH } }, () => renderBodyCheckbox(bindings)),
}))
