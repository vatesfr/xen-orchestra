import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import {
  type BackupJobPlanningFormData,
  useBackupJobPlanningForm,
} from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import ScheduleCronEditor from '@/modules/schedule/components/ScheduleCronEditor.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h, reactive } from 'vue'

function mountPlanningStep({ isMetadata = false } = {}) {
  const data = reactive<BackupJobPlanningFormData>({
    cron: '0 0 * * *',
    timezone: 'Europe/Paris',
    timeout: undefined,
    nRetriesVmBackupFailures: undefined,
    reportWhen: 'failure',
    reportRecipients: [],
    hideSuccessfulItems: false,
  })

  const wrapper = mount(
    defineComponent(() => {
      const { bindings } = useBackupJobPlanningForm(data)

      return () => h(BackupJobPlanningStep, { bindings, isMetadata })
    }),
    { global: createGlobalTestConfig() }
  )

  return { wrapper, data }
}

it('edits the schedule of the job in its timezone', () => {
  const { wrapper } = mountPlanningStep()

  expect(wrapper.getComponent(ScheduleCronEditor).props()).toMatchObject({
    modelValue: '0 0 * * *',
    timezone: 'Europe/Paris',
  })
})

it('handles the failures of a VM backup', () => {
  const { wrapper } = mountPlanningStep()

  expect(wrapper.text()).toContain(t('failure-handling'))
  expect(wrapper.findAllComponents(BackupJobFormNumberInput).map(input => input.props('label'))).toEqual([
    t('timeout'),
    t('vm-backup-failure-number-of-retries'),
  ])
})

it('does not handle the failures of a metadata backup', () => {
  const { wrapper } = mountPlanningStep({ isMetadata: true })

  expect(wrapper.text()).not.toContain(t('failure-handling'))
  expect(wrapper.findComponent(BackupJobFormNumberInput).exists()).toBe(false)
})

it('configures the report', () => {
  const { wrapper } = mountPlanningStep()

  expect(wrapper.text()).toContain(t('report-when'))
  expect(wrapper.text()).toContain(t('report-recipients'))
  expect(wrapper.text()).toContain(t('hide-successful-items'))
})
