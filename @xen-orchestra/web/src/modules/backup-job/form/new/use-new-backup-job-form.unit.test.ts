import { useNewBackupJobForm } from '@/modules/backup-job/form/new/use-new-backup-job-form.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([]),
    areBackupRepositoriesReady: ref(true),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([]),
    areVmsReady: ref(true),
    getVmById: () => undefined,
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([]),
    arePoolsReady: ref(true),
    getPoolById: () => undefined,
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ srs: ref([]), areSrsReady: ref(true) })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
  useXoVmBackupArchiveCollection: (() => ({
    backupArchives: ref([]),
    areBackupArchivesReady: ref(true),
  })) as unknown as typeof useXoVmBackupArchiveCollection,
}))

function mountNewForm() {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useNewBackupJobForm(), t }
  }).wrapper.vm
}

type NewForm = ReturnType<typeof mountNewForm>

async function selectDataSource(form: NewForm, dataSource: 'vm' | 'mirror' | 'metadata') {
  form.source.formData.dataSource = dataSource
  await flushPromises()
}

async function fillMetadataJob(form: NewForm) {
  await selectDataSource(form, 'metadata')
  form.source.formData.name = 'Metadata backup'
  form.target.backupRepository.formData.exportRetention = 3
}

describe('steps', () => {
  it('goes through the source, the transfer, the target, the planning and the review', () => {
    const form = mountNewForm()

    expect(form.steps.map(step => step.label)).toEqual([
      form.t('source'),
      form.t('transfer'),
      form.t('target'),
      form.t('planning'),
      form.t('review-and-confirm'),
    ])
  })

  it('skips the transfer of a metadata backup', async () => {
    const form = mountNewForm()

    await selectDataSource(form, 'metadata')

    expect(form.steps.map(step => step.label)).toEqual([
      form.t('source'),
      form.t('target'),
      form.t('planning'),
      form.t('review-and-confirm'),
    ])
  })
})

describe('next', () => {
  it('stays on an invalid step', async () => {
    const form = mountNewForm()

    await form.next()

    expect(form.currentStep).toBe('source')
  })

  it('goes to the next step once the current one is valid', async () => {
    const form = mountNewForm()
    form.source.formData.name = 'Daily backup'

    await form.next()

    expect(form.currentStep).toBe('transfer')
  })

  it('goes from the source to the target of a metadata backup', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)

    await form.next()

    expect(form.currentStep).toBe('target')
  })
})

describe('back', () => {
  it('goes back to the previous step', async () => {
    const form = mountNewForm()
    form.goToStep('target')

    form.back()

    expect(form.currentStep).toBe('transfer')
  })

  it('stays on the first step', () => {
    const form = mountNewForm()

    form.back()

    expect(form.currentStep).toBe('source')
  })
})

describe('goToStep', () => {
  it('goes to the given step', () => {
    const form = mountNewForm()

    form.goToStep('planning')

    expect(form.currentStep).toBe('planning')
  })
})

describe('formData', () => {
  it('starts the job from scratch, but its name, when the data source changes', async () => {
    const form = mountNewForm()
    form.source.formData.name = 'Daily backup'
    form.source.formData.scopeType = 'manual'
    form.transfer.formData.concurrency = 4
    form.target.formData.storageTargets = ['storage-repository']
    form.planning.formData.reportWhen = 'never'

    await selectDataSource(form, 'mirror')

    expect(form.source.formData).toMatchObject({ name: 'Daily backup', dataSource: 'mirror', scopeType: 'all' })
    expect(form.transfer.formData.concurrency).toBe(2)
    expect(form.target.formData.storageTargets).toEqual([])
    expect(form.planning.formData.reportWhen).toBe('failure')
  })
})

describe('validateAndBuildPayload', () => {
  it('builds no payload while a step is invalid', async () => {
    const form = mountNewForm()
    form.source.formData.name = 'Daily backup'

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })

  it('builds the payload of a valid job', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ type: 'metadataBackup', name: 'Metadata backup' })
  })

  it('ignores the transfer of a metadata backup', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)
    form.transfer.formData.concurrency = undefined

    expect(await form.validateAndBuildPayload()).toBeDefined()
  })
})
