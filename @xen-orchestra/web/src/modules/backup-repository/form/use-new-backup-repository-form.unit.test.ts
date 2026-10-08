import { NFS_DEFAULT_PORT } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import { SMB_DEFAULT_DOMAIN } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import { useNewBackupRepositoryForm } from '@/modules/backup-repository/form/use-new-backup-repository-form.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type BackupRepositoryType, format as formatBackupRepositoryUrl } from 'xo-remote-parser'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([{ id: 'proxy-1', name: 'Proxy 1' }]),
  })) as unknown as typeof useXoProxyCollection,
}))

function mountNewForm() {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useNewBackupRepositoryForm(), t }
  }).wrapper.vm
}

type NewForm = ReturnType<typeof mountNewForm>

async function selectType(form: NewForm, type: BackupRepositoryType) {
  form.general.formData.type = type
  await flushPromises()
}

async function fillGeneralStep(form: NewForm, type: BackupRepositoryType = 'nfs') {
  await selectType(form, type)
  form.general.formData.name = 'My repository'

  form.general.formData.backupFormat ??= 'vhd'
  await flushPromises()
}

function fillNfsDetails(form: NewForm) {
  Object.assign(form.details.nfs.formData, { host: '192.168.1.10', path: '/exports/backups' })
}

async function mountFormAtStep(step: 'details' | 'review') {
  const form = mountNewForm()
  await fillGeneralStep(form)
  fillNfsDetails(form)
  form.goToStep(step)

  return form
}

describe('steps', () => {
  it('leaves the details step unlabelled until a type is selected', () => {
    const form = mountNewForm()

    expect(form.steps.map(step => step.label)).toEqual([form.t('br-details'), '', form.t('review-and-confirm')])
  })

  it('labels the details step after the selected type', async () => {
    const form = mountNewForm()

    await selectType(form, 'nfs')

    expect(form.steps.map(step => step.label)).toEqual([
      form.t('br-details'),
      form.t('br-type-details', { type: form.t('nfs') }),
      form.t('review-and-confirm'),
    ])
  })
})

describe('details', () => {
  it('starts the details of a newly selected type from scratch', async () => {
    const form = mountNewForm()
    await selectType(form, 'nfs')
    fillNfsDetails(form)

    await selectType(form, 'smb')
    await selectType(form, 'nfs')

    expect(form.details.nfs.formData).toMatchObject({ host: '', path: '' })
  })

  it('starts the details from scratch when switching between azure and azurite', async () => {
    const form = mountNewForm()
    await selectType(form, 'azure')
    form.details.azure.formData.hostName = 'account.blob.core.windows.net'

    await selectType(form, 'azurite')

    expect(form.details.azure.formData.hostName).toBe('')
  })
})

describe('next', () => {
  it('starts on the general step', () => {
    expect(mountNewForm().currentStep).toBe('general')
  })

  it('stays on the general step while it is invalid', async () => {
    const form = mountNewForm()

    expect(await form.next()).toBe(false)
    expect(form.currentStep).toBe('general')
  })

  it('moves to the details step once the general step is valid', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form)

    expect(await form.next()).toBe(true)
    expect(form.currentStep).toBe('details')
  })

  it('stays on the details step while the details of the selected type are invalid', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form)
    form.goToStep('details')

    expect(await form.next()).toBe(false)
    expect(form.currentStep).toBe('details')
  })

  it('moves to the review step once the details are valid', async () => {
    const form = await mountFormAtStep('details')

    expect(await form.next()).toBe(true)
    expect(form.currentStep).toBe('review')
  })

  it('stays on the review step, which is the last one', async () => {
    const form = await mountFormAtStep('review')

    await form.next()

    expect(form.currentStep).toBe('review')
  })
})

describe('back', () => {
  it('moves to the previous step', async () => {
    const form = await mountFormAtStep('review')

    form.back()

    expect(form.currentStep).toBe('details')
  })

  it('stays on the general step, which is the first one', () => {
    const form = mountNewForm()

    form.back()

    expect(form.currentStep).toBe('general')
  })
})

describe('goToStep', () => {
  it('jumps to the given step', async () => {
    const form = await mountFormAtStep('review')

    form.goToStep('general')

    expect(form.currentStep).toBe('general')
    expect(form.currentStepIndex).toBe(0)
  })
})

describe('validateAndBuildPayload', () => {
  it('is undefined while no type is selected', async () => {
    expect(await mountNewForm().validateAndBuildPayload()).toBeUndefined()
  })

  it('is undefined when the general step is invalid', async () => {
    const form = mountNewForm()
    await selectType(form, 'nfs')
    fillNfsDetails(form)

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })

  it('is undefined when the details of the selected type are invalid', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form)

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })

  it('builds a local repository', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form, 'file')
    form.details.file.formData.path = '/var/lib/xoa/backups'

    expect(await form.validateAndBuildPayload()).toEqual({
      name: 'My repository',
      url: formatBackupRepositoryUrl({ type: 'file', path: '/var/lib/xoa/backups' }),
    })
  })

  it('builds an NFS repository', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form, 'nfs')
    fillNfsDetails(form)

    expect(await form.validateAndBuildPayload()).toEqual({
      name: 'My repository',
      url: formatBackupRepositoryUrl({
        type: 'nfs',
        host: '192.168.1.10',
        port: NFS_DEFAULT_PORT,
        path: '/exports/backups',
      }),
    })
  })

  it('builds an SMB repository', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form, 'smb')
    Object.assign(form.details.smb.formData, {
      pathOnShare: 'nas\\backups',
      subfolder: 'xo',
      username: 'admin',
      password: 'secret',
    })

    expect(await form.validateAndBuildPayload()).toEqual({
      name: 'My repository',
      url: formatBackupRepositoryUrl({
        type: 'smb',
        host: 'nas\\backups',
        path: 'xo',
        domain: SMB_DEFAULT_DOMAIN,
        username: 'admin',
        password: 'secret',
      }),
    })
  })

  it('builds an S3 repository, stored in VHD directories', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form, 's3')
    Object.assign(form.details.s3.formData, {
      endpoint: 's3.us-east-2.amazonaws.com',
      useHttps: true,
      region: 'us-east-2',
      accessKeyId: 'access-key',
      secret: 'secret-key',
      bucket: 'backups',
      pathInBucket: 'xo',
    })

    expect(await form.validateAndBuildPayload()).toEqual({
      name: 'My repository',
      url: formatBackupRepositoryUrl({
        type: 's3',
        protocol: 'https',
        host: 's3.us-east-2.amazonaws.com',
        path: 'backups/xo',
        region: 'us-east-2',
        username: 'access-key',
        password: 'secret-key',
        useVhdDirectory: true,
      }),
    })
  })

  it.each<BackupRepositoryType>(['azure', 'azurite'])('builds an %s repository', async type => {
    const form = mountNewForm()
    await fillGeneralStep(form, type)
    Object.assign(form.details.azure.formData, {
      hostName: 'account.blob.core.windows.net',
      accountName: 'account',
      key: 'account-key',
      containerName: 'backups',
    })

    expect(await form.validateAndBuildPayload()).toEqual({
      name: 'My repository',
      url: formatBackupRepositoryUrl({
        type,
        protocol: 'https',
        host: 'account.blob.core.windows.net',
        path: 'backups/',
        username: 'account',
        password: 'account-key',
        useVhdDirectory: true,
      }),
    })
  })

  it('carries the custom mount options and the selected proxy', async () => {
    const form = mountNewForm()
    await fillGeneralStep(form, 'nfs')
    fillNfsDetails(form)
    form.details.nfs.formData.customOptions = 'vers=4'
    form.general.formData.proxy = PROXY_ID

    expect(await form.validateAndBuildPayload()).toMatchObject({ options: 'vers=4', proxy: PROXY_ID })
  })
})
