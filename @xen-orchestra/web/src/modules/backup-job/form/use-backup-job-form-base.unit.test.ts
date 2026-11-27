import { createBackupJobFormDataSet, useBackupJobFormBase } from '@/modules/backup-job/form/use-backup-job-form-base.ts'
import { backupJobFormCollectionsMock, mockBackupJobFormCollections } from '@/test/mock-backup-job-form-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

mockBackupJobFormCollections()

beforeEach(() => {
  backupJobFormCollectionsMock.reset()
})

function mountForm(options?: Parameters<typeof useBackupJobFormBase>[1]) {
  return mountComposableWithI18n(() => useBackupJobFormBase(createBackupJobFormDataSet(), options))
}

type Form = ReturnType<typeof mountForm>

async function selectMetadata(form: Form) {
  form.source.formData.dataSource = 'metadata'
  await flushPromises()
}

async function fillMetadataJob(form: Form) {
  await selectMetadata(form)
  form.source.formData.name = 'Metadata backup'
  form.target.backupRepository.formData.exportRetention = 3
}

describe('steps', () => {
  it('goes through the source, the transfer, the target, the planning and the review', () => {
    expect(mountForm().steps).toEqual(['source', 'transfer', 'target', 'planning', 'review'])
  })

  it('has no transfer for a metadata backup', async () => {
    const form = mountForm()

    await selectMetadata(form)

    expect(form.steps).toEqual(['source', 'target', 'planning', 'review'])
  })

  it('keeps the transfer of a mirror backup', async () => {
    const form = mountForm()

    form.source.formData.dataSource = 'mirror'
    await flushPromises()

    expect(form.steps).toEqual(['source', 'transfer', 'target', 'planning', 'review'])
  })
})

describe('stepLabels', () => {
  it('labels every step', () => {
    const form = mountForm()

    expect(form.stepLabels).toEqual({
      source: form.t('source'),
      transfer: form.t('transfer'),
      target: form.t('target'),
      planning: form.t('planning'),
      review: form.t('review-and-confirm'),
    })
  })
})

describe('getInvalidSteps', () => {
  it('is empty when every step is valid', async () => {
    const form = mountForm()
    await fillMetadataJob(form)

    expect(await form.getInvalidSteps()).toEqual([])
  })

  it('lists the invalid steps in the order of the steps', async () => {
    const form = mountForm()
    await selectMetadata(form)

    expect(await form.getInvalidSteps()).toEqual(['source', 'target'])
  })

  it('does not list the review', async () => {
    const form = mountForm()

    expect(await form.getInvalidSteps()).not.toContain('review')
  })

  it('does not validate the transfer of a metadata backup', async () => {
    const form = mountForm()
    await fillMetadataJob(form)
    form.transfer.formData.concurrency = undefined

    expect(await form.getInvalidSteps()).toEqual([])
  })
})

describe('validateStep', () => {
  it('tells whether the given step is valid', async () => {
    const form = mountForm()
    await selectMetadata(form)

    expect(await form.validateStep('source')).toBe(false)
    expect(await form.validateStep('planning')).toBe(true)
  })
})

describe('validateAndBuildPayload', () => {
  it('builds no payload while a step is invalid', async () => {
    const form = mountForm()
    await selectMetadata(form)
    form.source.formData.name = 'Metadata backup'

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })

  it('builds the payload of a valid job', async () => {
    const form = mountForm()
    await fillMetadataJob(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ type: 'metadataBackup', name: 'Metadata backup' })
  })

  it('keys the schedule by default', async () => {
    const form = mountForm()
    await fillMetadataJob(form)

    const payload = await form.validateAndBuildPayload()

    expect(Object.keys(payload!.schedules)).toHaveLength(1)
    expect(Object.keys(payload!.schedules)).toEqual(Object.keys(payload!.settings).filter(key => key !== ''))
  })

  it('keys the schedule by the given schedule key', async () => {
    const form = mountForm({ scheduleKey: 'schedule-1' })
    await fillMetadataJob(form)

    const payload = await form.validateAndBuildPayload()

    expect(Object.keys(payload!.schedules)).toEqual(['schedule-1'])
    expect(payload!.settings['schedule-1']).toMatchObject({ retentionPoolMetadata: 3 })
  })
})

describe('isEditing', () => {
  it('lets the data source and the mode be chosen by default', () => {
    const form = mountForm()

    expect(form.source.bindings.dataSource.disabled).toBeFalsy()
    expect(form.source.bindings.mode.disabled).toBeFalsy()
  })

  it('disables the data source and the mode when editing', () => {
    const form = mountForm({ isEditing: true })

    expect(form.source.bindings.dataSource.disabled).toBe(true)
    expect(form.source.bindings.mode.disabled).toBe(true)
  })
})
