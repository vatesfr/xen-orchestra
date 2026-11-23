import type { NewVmTableValidation } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export type NewVmTableRow<TItem extends { key: string } = { key: string }> = {
  item: TItem
  rank: number
  fieldId: string | undefined
  isInError: boolean
  isWarned: boolean
}

export function useNewVmTableRows<TItem extends { key: string }, TField extends string>(
  items: MaybeRefOrGetter<TItem[]>,
  validation: MaybeRefOrGetter<NewVmTableValidation<TField>>,
  firstField: TField
) {
  const firstInErrorKey = computed(() => toValue(items).find(item => toValue(validation).issues.has(item.key))?.key)

  function getErrorFieldId(key: string, field: TField) {
    const { issues, errorFieldId } = toValue(validation)

    return key === firstInErrorKey.value && issues.get(key)?.[0]?.field === field ? errorFieldId : undefined
  }

  const rows = computed(() => {
    const { issues, warnedKeys } = toValue(validation)

    return toValue(items).map(
      (item, index): NewVmTableRow<TItem> => ({
        item,
        rank: index + 1,
        fieldId: getErrorFieldId(item.key, firstField),
        isInError: issues.has(item.key),
        isWarned: warnedKeys.has(item.key),
      })
    )
  })

  return { rows, getErrorFieldId }
}
