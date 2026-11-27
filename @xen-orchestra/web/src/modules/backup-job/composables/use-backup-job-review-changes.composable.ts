import { isEqual } from 'lodash-es'
import { type MaybeRefOrGetter, toValue } from 'vue'

export type BackupJobSelectionChanges = {
  addedIds: string[]
  deletedCount: number
}

export function useBackupJobReviewChanges<TFormData extends object>(
  rawFormData: MaybeRefOrGetter<TFormData>,
  rawSavedFormData: MaybeRefOrGetter<TFormData | undefined>
) {
  function isOverridden(...keys: (keyof TFormData)[]): boolean {
    const formData = toValue(rawFormData)
    const savedFormData = toValue(rawSavedFormData)

    return savedFormData !== undefined && keys.some(key => !isEqual(formData[key], savedFormData[key]))
  }

  function getSelectionChanges(
    scopeTypeKey: keyof TFormData,
    idsKey: keyof TFormData
  ): BackupJobSelectionChanges | undefined {
    const formData = toValue(rawFormData)
    const savedFormData = toValue(rawSavedFormData)

    if (savedFormData === undefined || formData[scopeTypeKey] !== 'manual' || savedFormData[scopeTypeKey] !== 'manual') {
      return undefined
    }

    const ids = formData[idsKey] as string[]
    const savedIds = savedFormData[idsKey] as string[]

    return {
      addedIds: ids.filter(id => !savedIds.includes(id)),
      deletedCount: savedIds.filter(id => !ids.includes(id)).length,
    }
  }

  return {
    isOverridden,
    getSelectionChanges,
  }
}
