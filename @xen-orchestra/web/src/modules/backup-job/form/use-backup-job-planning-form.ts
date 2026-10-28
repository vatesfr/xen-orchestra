import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobPlanningFormData = {
  cron: string
  timezone: string | undefined
  timeout: number | undefined
  nRetriesVmBackupFailures: number | undefined
}

export type BackupJobPlanningForm = ReturnType<typeof useBackupJobPlanningForm>

export function useBackupJobPlanningForm(formData: BackupJobPlanningFormData) {
  const { t } = useI18n()

  const { useField, validate, reset } = useValidatedForm(formData, {})

  const bindings = reactive({
    cron: useField('cron'),
    timezone: useField('timezone'),
    timeout: useField('timeout', () => ({ label: t('timeout'), info: t('timeout-info'), unit: t('hours') })),
    nRetriesVmBackupFailures: useField('nRetriesVmBackupFailures', () => ({
      label: t('number-of-retries-if-vm-backup-fails'),
    })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
