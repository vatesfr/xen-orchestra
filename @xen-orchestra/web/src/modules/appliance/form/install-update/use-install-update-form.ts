import { useFormBindings } from '@core/packages/form-bindings'
import { reactive } from 'vue'

export type InstallUpdateFormData = {
  snapshot: boolean
}

export type InstallUpdatePayload = {
  snapshot: boolean
}

export function useInstallUpdateForm() {
  const formData = reactive<InstallUpdateFormData>({
    snapshot: true,
  })

  const { useField } = useFormBindings(formData)

  function buildPayload(): InstallUpdatePayload {
    return {
      snapshot: formData.snapshot,
    }
  }

  return {
    snapshotCheckboxBindings: useField('snapshot'),
    buildPayload,
  }
}
