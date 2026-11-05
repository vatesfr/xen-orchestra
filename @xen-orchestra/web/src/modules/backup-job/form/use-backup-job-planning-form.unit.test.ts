import {
  type BackupJobPlanningFormData,
  useBackupJobPlanningForm,
} from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

function createPlanningFormData(): BackupJobPlanningFormData {
  return {
    cron: '0 0 * * *',
    timezone: 'Europe/Paris',
    timeout: undefined,
    nRetriesVmBackupFailures: undefined,
    reportWhen: 'failure',
    reportRecipients: [],
    hideSuccessfulItems: false,
  }
}

function mountPlanningForm() {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useBackupJobPlanningForm(reactive(createPlanningFormData())), t }
  }).wrapper.vm
}

describe('bindings', () => {
  it('offers to report always, on skipped items and failures, on errors only or never', () => {
    const form = mountPlanningForm()

    expect(form.bindings.reportWhen.options).toEqual([
      { label: form.t('report-when:always'), value: 'always' },
      { label: form.t('report-when:skipped-and-failure'), value: 'failure' },
      { label: form.t('report-when:error'), value: 'error' },
      { label: form.t('report-when:never'), value: 'never' },
    ])
  })

  it('binds the report when field to the form data', () => {
    const form = mountPlanningForm()

    form.bindings.reportWhen['onUpdate:modelValue']('never')

    expect(form.formData.reportWhen).toBe('never')
  })
})

describe('getReportWhenLabel', () => {
  it('labels the report when value', () => {
    const form = mountPlanningForm()

    expect(form.getReportWhenLabel('error')).toBe(form.t('report-when:error'))
  })
})

describe('validate', () => {
  it('accepts the default planning', async () => {
    const form = mountPlanningForm()

    expect(await form.validate()).toBe(true)
  })
})
