import type { BackupJobFormOption } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { XoBackupJobReportWhen } from '@/modules/backup-job/types/xo-backup-job.type.ts'
import { BACKUP_JOB_REPORT_WHEN_LABEL_KEYS } from '@/modules/backup-job/utils/backup-job-report-when.util.ts'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type BackupJobPlanningFormData = {
  cron: string
  timezone: string | undefined
  timeout: number | undefined
  nRetriesVmBackupFailures: number | undefined
  reportWhen: XoBackupJobReportWhen
  reportRecipients: string[]
  hideSuccessfulItems: boolean
}

export type BackupJobPlanningForm = ReturnType<typeof useBackupJobPlanningForm>

export function useBackupJobPlanningForm(formData: BackupJobPlanningFormData) {
  const { t } = useI18n()

  const { useField, validate, reset } = useValidatedForm(formData, {})

  function getReportWhenLabel(reportWhen: XoBackupJobReportWhen): string {
    return t(BACKUP_JOB_REPORT_WHEN_LABEL_KEYS[reportWhen])
  }

  const reportWhenOptions = computed<BackupJobFormOption<XoBackupJobReportWhen>[]>(() =>
    Object.entries(BACKUP_JOB_REPORT_WHEN_LABEL_KEYS).map(([value, labelKey]) => ({
      label: t(labelKey),
      value: value as XoBackupJobReportWhen,
    }))
  )

  const bindings = reactive({
    cron: useField('cron'),
    timezone: useField('timezone'),
    timeout: useField('timeout', () => ({ label: t('timeout'), info: t('timeout-info'), unit: t('cron:unit:hour') })),
    nRetriesVmBackupFailures: useField('nRetriesVmBackupFailures', () => ({
      label: t('vm-backup-failure-number-of-retries'),
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
    getReportWhenLabel,
  }
}
