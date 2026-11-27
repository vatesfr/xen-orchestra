import { useNewBackupJobForm } from '@/modules/backup-job/form/new/use-new-backup-job-form.ts'
import type {
  FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

const ENABLED_BR = createBr({ id: 'br-enabled' as FrontXoBackupRepository['id'] })
const DISABLED_BR = createBr({ id: 'br-disabled' as FrontXoBackupRepository['id'], enabled: false })
const PROXY_BR = createBr({ id: 'br-proxy' as FrontXoBackupRepository['id'], proxy: PROXY_ID })

const POOL = { id: 'pool-1', name_label: 'Pool 1' } as FrontXoPool

mockModule(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ proxies: ref([]) })) as unknown as typeof useXoProxyCollection,
}))

mockModule(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([ENABLED_BR, DISABLED_BR, PROXY_BR]),
    areBackupRepositoriesReady: ref(true),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

mockModule(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([]),
    areVmsReady: ref(true),
    getVmById: () => undefined,
  })) as unknown as typeof useXoVmCollection,
}))

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([POOL]),
    arePoolsReady: ref(true),
    getPoolById: () => undefined,
  })) as unknown as typeof useXoPoolCollection,
}))

mockModule(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ srs: ref([]), areSrsReady: ref(true) })) as unknown as typeof useXoSrCollection,
}))

mockModule(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: (() => ({
    getPbdsByIds: () => [],
    pbdsBySr: ref(new Map()),
  })) as unknown as typeof useXoPbdCollection,
}))

mockModule(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById: () => undefined })) as unknown as typeof useXoHostCollection,
}))

mockModule(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

mockModule(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

mockModule(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
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

  it('stays on the review, which is the last step', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)
    form.goToStep('review')

    await form.next()

    expect(form.currentStep).toBe('review')
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
  it('starts the job from scratch, but its name and its activation, when the data source changes', async () => {
    const form = mountNewForm()
    form.source.formData.name = 'Daily backup'
    form.source.formData.enabled = false
    form.source.formData.scopeType = 'manual'
    form.transfer.formData.concurrency = 4
    form.target.formData.storageTargets = ['storage-repository']
    form.planning.formData.reportWhen = 'never'

    await selectDataSource(form, 'mirror')

    expect(form.source.formData).toMatchObject({
      name: 'Daily backup',
      enabled: false,
      dataSource: 'mirror',
      scopeType: 'all',
    })
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

  it('targets every backup repository when all are selected', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ remotes: '*' })
  })

  it('saves the metadata of every pool when all are selected', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)

    expect(await form.validateAndBuildPayload()).toMatchObject({ pools: '*' })
  })

  it('ignores the transfer of a metadata backup', async () => {
    const form = mountNewForm()
    await fillMetadataJob(form)
    form.transfer.formData.concurrency = undefined

    expect(await form.validateAndBuildPayload()).toBeDefined()
  })
})
