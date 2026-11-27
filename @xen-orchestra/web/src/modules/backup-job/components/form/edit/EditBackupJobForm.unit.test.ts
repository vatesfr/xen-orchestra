import EditBackupJobForm from '@/modules/backup-job/components/form/edit/EditBackupJobForm.vue'
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import type { BackupJobFormStep } from '@/modules/backup-job/types/backup-job-form.type.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMetadataBackupJob, createMirrorBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { backupJobFormCollectionsMock, mockBackupJobFormCollections } from '@/test/mock-backup-job-form-collections.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { flushPromises, mount } from '@vue/test-utils'

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

const ALL_STEPS = Object.keys(STEPS) as BackupJobFormStep[]

const STEP_LABELS: Record<BackupJobFormStep, string> = {
  source: t('source'),
  transfer: t('transfer'),
  target: t('target'),
  planning: t('planning'),
  review: t('review-and-confirm'),
}

const VALID_METADATA_JOB = createMetadataBackupJob({
  name: 'Metadata job',
  settings: { '': {}, [SCHEDULE.id]: { retentionXoMetadata: 3 } },
})

const INVALID_METADATA_JOB = createMetadataBackupJob({ name: 'Metadata job', settings: { '': {} } })

const MIRROR_JOB = createMirrorBackupJob({ name: 'Mirror job' })

async function mountForm({
  backupJob = VALID_METADATA_JOB,
  step = 'review',
  hasRemovedTargetBackupRepository = false,
}: {
  backupJob?: Parameters<typeof getBackupJobFormInitialData>[0]
  step?: BackupJobFormStep
  hasRemovedTargetBackupRepository?: boolean
} = {}) {
  const wrapper = mount(EditBackupJobForm, {
    props: {
      appliedFormDataSet: getBackupJobFormInitialData(backupJob, SCHEDULE),
      scheduleId: SCHEDULE.id,
      step,
      hasRemovedTargetBackupRepository,
    },
    global: createGlobalTestConfig({
      stubs: {
        BackupJobSourceStep: true,
        BackupJobTransferStep: true,
        BackupJobTargetStep: true,
        BackupJobPlanningStep: true,
        BackupJobReviewStep: true,
      },
    }),
  })

  await flushPromises()

  return wrapper
}

function findAlerts(wrapper: Awaited<ReturnType<typeof mountForm>>) {
  return wrapper.findAllComponents(UiAlert).map(alert => ({ accent: alert.props('accent'), text: alert.text() }))
}

function findRenderedSteps(wrapper: Awaited<ReturnType<typeof mountForm>>) {
  return ALL_STEPS.filter(step => wrapper.findComponent(STEPS[step]).exists())
}

describe('header', () => {
  it('shows the name of the job', async () => {
    const wrapper = await mountForm()

    expect(wrapper.get('.job-name').text()).toBe('Metadata job')
  })

  it.each(ALL_STEPS)('shows the label of the %s step', async step => {
    const wrapper = await mountForm({ backupJob: MIRROR_JOB, step })

    expect(wrapper.get('.header .typo-h3').text()).toBe(STEP_LABELS[step])
  })
})

describe('step', () => {
  it.each(ALL_STEPS)('only shows the %s step when it is the opened one', async step => {
    const wrapper = await mountForm({ backupJob: MIRROR_JOB, step })

    expect(findRenderedSteps(wrapper)).toEqual([step])
  })

  it('gives the planning step the kind of job', async () => {
    const metadataWrapper = await mountForm({ step: 'planning' })
    const mirrorWrapper = await mountForm({ backupJob: MIRROR_JOB, step: 'planning' })

    expect(metadataWrapper.getComponent(BackupJobPlanningStep).props('isMetadata')).toBe(true)
    expect(mirrorWrapper.getComponent(BackupJobPlanningStep).props('isMetadata')).toBe(false)
  })

  it('gives the transfer step the kind of backup of the job', async () => {
    const wrapper = await mountForm({ backupJob: MIRROR_JOB, step: 'transfer' })

    expect(wrapper.getComponent(BackupJobTransferStep).props()).toMatchObject({ isIncremental: true, isMirror: true })
  })
})

describe('review', () => {
  it('reviews the transfer of a job which has one', async () => {
    const wrapper = await mountForm({ backupJob: MIRROR_JOB })

    expect(wrapper.getComponent(BackupJobReviewStep).props('transfer')).toBeDefined()
  })

  it('reviews no transfer for a metadata backup', async () => {
    const wrapper = await mountForm()

    expect(wrapper.getComponent(BackupJobReviewStep).props('transfer')).toBeUndefined()
  })

  it('tells nothing when every step is valid', async () => {
    const wrapper = await mountForm()

    expect(findAlerts(wrapper)).toEqual([])
    expect(wrapper.getComponent(BackupJobReviewStep).props('invalidSteps')).toEqual([])
  })

  it('tells some steps contain errors, and which ones, when the job is invalid', async () => {
    const wrapper = await mountForm({ backupJob: INVALID_METADATA_JOB })

    expect(findAlerts(wrapper)).toEqual([{ accent: 'danger', text: t('some-steps-contain-errors') }])
    expect(wrapper.getComponent(BackupJobReviewStep).props('invalidSteps')).toEqual(['target'])
  })

  it('tells nothing while the backup repositories are loading', async () => {
    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = false

    const wrapper = await mountForm({ backupJob: INVALID_METADATA_JOB })

    expect(findAlerts(wrapper)).toEqual([])
  })

  it('emits edit with the step the review asks to edit', async () => {
    const wrapper = await mountForm()

    wrapper.getComponent(BackupJobReviewStep).vm.$emit('edit', 'target')

    expect(wrapper.emitted('edit')).toEqual([['target']])
  })
})

describe('removed target backup repository', () => {
  it('warns on the target step', async () => {
    const wrapper = await mountForm({ step: 'target', hasRemovedTargetBackupRepository: true })

    expect(findAlerts(wrapper)).toEqual([
      { accent: 'warning', text: t('source-backup-repository-removed-from-targets') },
    ])
  })

  it('does not warn on the target step when no target backup repository was removed', async () => {
    const wrapper = await mountForm({ step: 'target' })

    expect(findAlerts(wrapper)).toEqual([])
  })

  it('does not warn on the other steps', async () => {
    const wrapper = await mountForm({ step: 'source', hasRemovedTargetBackupRepository: true })

    expect(findAlerts(wrapper)).toEqual([])
  })
})

describe('exposed validation', () => {
  it('validates a step and copies the form data', async () => {
    const wrapper = await mountForm({ step: 'source' })

    const formDataSet = await wrapper.vm.validateStepAndCopyFormDataSet('source')

    expect(formDataSet?.source).toMatchObject({ name: 'Metadata job', dataSource: 'metadata' })
  })

  it('builds the payload of a valid job, the schedule being keyed by its id', async () => {
    const wrapper = await mountForm()

    const payload = await wrapper.vm.validateAndBuildPayload()

    expect(payload).toMatchObject({ type: 'metadataBackup', name: 'Metadata job' })
    expect(Object.keys(payload!.schedules)).toEqual([SCHEDULE.id])
  })

  it('builds no payload of an invalid job', async () => {
    const wrapper = await mountForm({ backupJob: INVALID_METADATA_JOB })

    expect(await wrapper.vm.validateAndBuildPayload()).toBeUndefined()
  })

  it('tells the invalid steps after building the payload', async () => {
    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = false
    const wrapper = await mountForm({ backupJob: INVALID_METADATA_JOB })

    await wrapper.vm.validateAndBuildPayload()
    await flushPromises()

    expect(findAlerts(wrapper)).toEqual([{ accent: 'danger', text: t('some-steps-contain-errors') }])
  })
})
