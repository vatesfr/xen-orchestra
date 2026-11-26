import type { IconName } from '@core/icons'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type CheckboxModel = boolean | undefined | string[]

export function useCheckboxState(model: MaybeRefOrGetter<CheckboxModel>, value: MaybeRefOrGetter<string | undefined>) {
  const isIndeterminate = computed(() => toValue(model) === undefined)

  const isChecked = computed(() => {
    const modelValue = toValue(model)

    return Array.isArray(modelValue) ? modelValue.some(item => item === toValue(value)) : modelValue === true
  })

  const icon = computed<IconName>(() => {
    if (isIndeterminate.value) {
      return 'status:checkbox-partially-checked'
    }

    return isChecked.value ? 'status:checkbox-checked' : 'status:checkbox'
  })

  return { isIndeterminate, isChecked, icon }
}
