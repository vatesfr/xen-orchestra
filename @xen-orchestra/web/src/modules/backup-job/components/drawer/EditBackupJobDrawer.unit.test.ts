import EditBackupJobDrawer from '@/modules/backup-job/components/drawer/EditBackupJobDrawer.vue'
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import type { BackupJobFormDataStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMetadataBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { backupJobFormCollectionsMock, mockBackupJobFormCollections } from '@/test/mock-backup-job-form-collections.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

mockBackupJobFormCollections()

beforeEach(() => {
  backupJobFormCollectionsMock.reset()
})

const SCHEDULE = createSchedule({ id: 'schedule-1' as FrontXoSchedule['id'] })

const STEPS = {
  source: BackupJobSourceStep,
  transfer: BackupJobTransferStep,
  target: BackupJobTargetStep,
  planning: BackupJobPlanningStep,
  review: BackupJobReviewStep,
}

const VALID_JOB = createMetadataBackupJob({
  name: 'Metadata job',
  settings: { '': {}, [SCHEDULE.id]: { retentionXoMetadata: 3 } },
})

async function mountDrawer(backupJob = VALID_JOB) {
  const wrapper = mount(EditBackupJobDrawer, {
    props: { backupJob, schedule: SCHEDULE },
    global: createGlobalTestConfig({
      stubs: {
        BackupJobSourceStep: true,
        BackupJobTransferStep: true,
        BackupJobTargetStep: true,
        BackupJobPlanningStep: true,
        BackupJobReviewStep: true,
      },
    }),
    attachTo: document.body,
  })
  await flushPromises()

  return wrapper
}

function findRenderedSteps(wrapper: VueWrapper) {
  return (Object.keys(STEPS) as (keyof typeof STEPS)[]).filter(step => wrapper.findComponent(STEPS[step]).exists())
}

async function editStep(wrapper: VueWrapper, step: BackupJobFormDataStep) {
  wrapper.getComponent(BackupJobReviewStep).vm.$emit('edit', step)
  await flushPromises()
}

async function cancel(wrapper: VueWrapper) {
  await cancelDrawer(wrapper)
  await flushPromises()
}

async function renameJob(wrapper: VueWrapper, name: string) {
  await editStep(wrapper, 'source')
  wrapper.getComponent(BackupJobSourceStep).props('form').formData.name = name
}

describe('review', () => {
  it('is the first view, offering to cancel or to save', async () => {
    const wrapper = await mountDrawer()

    expect(findRenderedSteps(wrapper)).toEqual(['review'])
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:save')])
  })

  it('cancels from the cancel button', async () => {
    const wrapper = await mountDrawer()

    await cancel(wrapper)

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('opens the step to edit', async () => {
    const wrapper = await mountDrawer()

    await editStep(wrapper, 'planning')

    expect(findRenderedSteps(wrapper)).toEqual(['planning'])
  })

  it('confirms the payload of the job when it is saved', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [
        expect.objectContaining({
          type: 'metadataBackup',
          name: 'Metadata job',
          schedules: { [SCHEDULE.id]: expect.objectContaining({ cron: SCHEDULE.cron }) },
        }),
      ],
    ])
  })

  it('does not confirm when a step is invalid', async () => {
    const wrapper = await mountDrawer(createMetadataBackupJob({ name: 'Metadata job', settings: { '': {} } }))

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(findRenderedSteps(wrapper)).toEqual(['review'])
  })
})

describe('step', () => {
  it('offers to cancel or to apply', async () => {
    const wrapper = await mountDrawer()

    await editStep(wrapper, 'planning')

    expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:apply')])
  })

  it('goes back to the review from the cancel button, without cancelling the drawer', async () => {
    const wrapper = await mountDrawer()
    await editStep(wrapper, 'planning')

    await cancel(wrapper)

    expect(findRenderedSteps(wrapper)).toEqual(['review'])
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('goes back to the review when the step is applied', async () => {
    const wrapper = await mountDrawer()
    await editStep(wrapper, 'planning')

    await submitDrawer(wrapper)

    expect(findRenderedSteps(wrapper)).toEqual(['review'])
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('stays on the step when it is applied while invalid', async () => {
    const wrapper = await mountDrawer(createMetadataBackupJob({ name: '', settings: { '': {} } }))
    await editStep(wrapper, 'source')

    await submitDrawer(wrapper)

    expect(findRenderedSteps(wrapper)).toEqual(['source'])
  })

  it('keeps the applied changes in the confirmed payload', async () => {
    const wrapper = await mountDrawer()
    await renameJob(wrapper, 'Renamed job')
    await submitDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[expect.objectContaining({ name: 'Renamed job' })]])
  })

  it('drops the changes of a cancelled step', async () => {
    const wrapper = await mountDrawer()
    await renameJob(wrapper, 'Renamed job')
    await cancel(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[expect.objectContaining({ name: 'Metadata job' })]])
  })
})
