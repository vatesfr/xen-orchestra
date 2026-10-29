import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobReportWhen = 'always' | 'failure' | 'error' | 'never'

export type BackupJobPlanningFormData = {
  enabled: boolean
  cron: string
  timezone: string | undefined
  timeout: number | undefined
  nRetriesVmBackupFailures: number | undefined
  reportWhen: BackupJobReportWhen
  reportRecipients: string[]
  hideSuccessfulItems: boolean
}

export type BackupJobPlanningForm = ReturnType<typeof useBackupJobPlanningForm>

export function useBackupJobPlanningForm(formData: BackupJobPlanningFormData) {
  const { t } = useI18n()

  const { useField, validate, reset } = useValidatedForm(formData, {})

  const reportWhenOptions = computed<{ label: string; value: BackupJobReportWhen }[]>(() => [
    { label: t('report-when:always'), value: 'always' },
    { label: t('report-when:skipped-and-failure'), value: 'failure' },
    { label: t('report-when:error'), value: 'error' },
    { label: t('report-when:never'), value: 'never' },
  ])

  const bindings = reactive({
    enabled: useField('enabled'),
    cron: useField('cron'),
    timezone: useField('timezone'),
    timeout: useField('timeout', () => ({ label: t('timeout'), info: t('timeout-info'), unit: t('hours') })),
    nRetriesVmBackupFailures: useField('nRetriesVmBackupFailures', () => ({
      label: t('number-of-retries-if-vm-backup-fails'),
    })),
    reportWhen: useField('reportWhen', () => ({ label: t('report-when'), options: reportWhenOptions.value })),
    reportRecipients: useField('reportRecipients', () => ({ label: t('report-recipients') })),
    hideSuccessfulItems: useField('hideSuccessfulItems', () => ({
      label: t('hide-successful-items'),
      info: t('hide-successful-items-info'),
    })),
  })

  return {
    formData,
    bindings,
    validate,
    reset,
  }
}
