import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'

export type BackupJobPlanningFormData = {
  cron: string
  timezone: string | undefined
}

export type BackupJobPlanningForm = ReturnType<typeof useBackupJobPlanningForm>

export function useBackupJobPlanningForm(formData: BackupJobPlanningFormData) {
  const { useField, validate, reset } = useValidatedForm(formData, {})

  const bindings = reactive({
    cron: useField('cron'),
    timezone: useField('timezone'),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
