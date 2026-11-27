import { useEditBackupJobForm } from '@/modules/backup-job/form/edit/use-edit-backup-job-form.ts'
import type { FrontXoMetadataBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import { createMetadataBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { backupJobFormCollectionsMock, mockBackupJobFormCollections } from '@/test/mock-backup-job-form-collections.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

mockBackupJobFormCollections()

beforeEach(() => {
  backupJobFormCollectionsMock.reset()
})

const SCHEDULE = createSchedule({ id: 'schedule-1' as ReturnType<typeof createSchedule>['id'] })

function createJob(withRetention: boolean): FrontXoMetadataBackupJob {
  return createMetadataBackupJob({
    name: 'Metadata job',
    settings: { '': {}, [SCHEDULE.id]: { retentionXoMetadata: withRetention ? 3 : undefined } },
  })
}

type Step = Parameters<typeof useEditBackupJobForm>[2]

async function mountEditForm({ withRetention = true, step = 'review' }: { withRetention?: boolean; step?: Step } = {}) {
  const appliedFormDataSet = getBackupJobFormInitialData(createJob(withRetention), SCHEDULE)
  const form = mountComposableWithI18n(() => useEditBackupJobForm(appliedFormDataSet, SCHEDULE.id, step))

  await flushPromises()

  return { form, appliedFormDataSet }
}

describe('form data', () => {
  it('starts from the applied data', async () => {
    const { form } = await mountEditForm()

    expect(form.source.formData).toMatchObject({ name: 'Metadata job', dataSource: 'metadata' })
    expect(form.target.backupRepository.formData.exportRetention).toBe(3)
  })

  it('works on a copy of the applied data', async () => {
    const { form, appliedFormDataSet } = await mountEditForm()

    form.source.formData.name = 'Renamed job'
    form.target.backupRepository.formData.exportRetention = 10

    expect(appliedFormDataSet.source.name).toBe('Metadata job')
    expect(appliedFormDataSet.target.backupRepository.exportRetention).toBe(3)
  })

  it('does not let the data dependant fields be edited', async () => {
    const { form } = await mountEditForm()

    expect(form.source.bindings.dataSource.disabled).toBe(true)
    expect(form.source.bindings.mode.disabled).toBe(true)
  })
})

describe('validateStepAndCopyFormDataSet', () => {
  it('gives a copy of the edited data when the step is valid', async () => {
    const { form } = await mountEditForm({ step: 'source' })
    form.source.formData.name = 'Renamed job'

    const formDataSet = await form.validateStepAndCopyFormDataSet('source')

    expect(formDataSet?.source.name).toBe('Renamed job')
    expect(formDataSet?.target.backupRepository.exportRetention).toBe(3)
  })

  it('gives a copy detached from the form', async () => {
    const { form } = await mountEditForm({ step: 'source' })

    const formDataSet = await form.validateStepAndCopyFormDataSet('source')
    formDataSet!.source.name = 'Changed after the copy'

    expect(form.source.formData.name).toBe('Metadata job')
  })

  it('gives nothing when the step is invalid', async () => {
    const { form } = await mountEditForm({ step: 'source' })
    form.source.formData.name = ''

    expect(await form.validateStepAndCopyFormDataSet('source')).toBeUndefined()
  })

  it('only validates the given step', async () => {
    const { form } = await mountEditForm({ step: 'source', withRetention: false })

    expect(await form.validateStepAndCopyFormDataSet('source')).toBeDefined()
    expect(await form.validateStepAndCopyFormDataSet('target')).toBeUndefined()
  })
})

describe('invalidSteps', () => {
  it('is empty when every step is valid', async () => {
    const { form } = await mountEditForm()

    expect(form.invalidSteps).toEqual([])
  })

  it('lists the invalid steps of the review once the backup repositories and the SRs are ready', async () => {
    const { form } = await mountEditForm({ withRetention: false })

    expect(form.invalidSteps).toEqual(['target'])
  })

  it('waits for the backup repositories before validating the review', async () => {
    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = false
    const { form } = await mountEditForm({ withRetention: false })

    expect(form.invalidSteps).toEqual([])

    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = true
    await flushPromises()

    expect(form.invalidSteps).toEqual(['target'])
  })

  it('waits for the SRs before validating the review', async () => {
    xoCollectionsMock.areSrsReady.value = false
    const { form } = await mountEditForm({ withRetention: false })

    expect(form.invalidSteps).toEqual([])

    xoCollectionsMock.areSrsReady.value = true
    await flushPromises()

    expect(form.invalidSteps).toEqual(['target'])
  })

  it('stays empty when an other step than the review is opened', async () => {
    const { form } = await mountEditForm({ withRetention: false, step: 'source' })

    expect(form.invalidSteps).toEqual([])
  })
})

describe('opened step', () => {
  it('shows the errors of the opened step once the collections are ready', async () => {
    const { form } = await mountEditForm({ withRetention: false, step: 'target' })

    expect(form.target.backupRepository.bindings.exportRetention.error).toMatchObject({
      content: form.t('minimum-backups-to-retain-mandatory'),
    })
  })

  it('waits for the collections before validating the opened step', async () => {
    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = false
    const { form } = await mountEditForm({ withRetention: false, step: 'target' })

    expect(form.target.backupRepository.bindings.exportRetention.error).toBeUndefined()

    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = true
    await flushPromises()

    expect(form.target.backupRepository.bindings.exportRetention.error).toBeDefined()
  })

  it('shows no error on a valid step', async () => {
    const { form } = await mountEditForm({ step: 'target' })

    expect(form.target.backupRepository.bindings.exportRetention.error).toBeUndefined()
  })
})

describe('validateAndBuildPayload', () => {
  it('builds the payload of a valid job, the schedule being keyed by its id', async () => {
    const { form } = await mountEditForm()

    const payload = await form.validateAndBuildPayload()

    expect(payload).toMatchObject({ type: 'metadataBackup', name: 'Metadata job' })
    expect(Object.keys(payload!.schedules)).toEqual([SCHEDULE.id])
    expect(payload!.settings[SCHEDULE.id]).toMatchObject({ retentionXoMetadata: 3 })
  })

  it('builds the payload of the edited data', async () => {
    const { form } = await mountEditForm()
    form.source.formData.name = 'Renamed job'

    expect(await form.validateAndBuildPayload()).toMatchObject({ name: 'Renamed job' })
  })

  it('builds no payload while a step is invalid, and lists the invalid steps', async () => {
    backupJobFormCollectionsMock.areBackupRepositoriesReady.value = false
    const { form } = await mountEditForm({ withRetention: false })
    expect(form.invalidSteps).toEqual([])

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.invalidSteps).toEqual(['target'])
  })

  it('forgets the invalid steps once they are fixed', async () => {
    const { form } = await mountEditForm({ withRetention: false })
    expect(form.invalidSteps).toEqual(['target'])
    form.target.backupRepository.formData.exportRetention = 2

    expect(await form.validateAndBuildPayload()).toBeDefined()
    expect(form.invalidSteps).toEqual([])
  })
})
