import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import { BACKUP_JOB_REPORT_WHEN_LABEL_KEYS } from '@/modules/backup-job/utils/backup-job-report-when.util.ts'
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

  const reportWhenOptions = computed<BackupJobFormOption<BackupJobReportWhen>[]>(() =>
    Object.entries(BACKUP_JOB_REPORT_WHEN_LABEL_KEYS).map(([value, labelKey]) => ({
      label: t(labelKey),
      value: value as BackupJobReportWhen,
    }))
  )

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
