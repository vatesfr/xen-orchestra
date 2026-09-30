import NewBackupRepositoryReviewStep from '@/modules/backup-repository/components/form/steps/NewBackupRepositoryReviewStep.vue'
import { NFS_DEFAULT_PORT } from '@/modules/backup-repository/form/details/use-nfs-backup-repository-details-form.ts'
import { SMB_DEFAULT_DOMAIN } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import { useNewBackupRepositoryForm } from '@/modules/backup-repository/form/use-new-backup-repository-form.ts'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'
import type { BackupRepositoryType } from 'xo-remote-parser'

const { PROXY } = vi.hoisted(() => ({
  PROXY: { id: 'proxy-1', name: 'Proxy 1' } as FrontXoProxy,
}))

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([PROXY]),
    useGetProxyById: (id: MaybeRefOrGetter<FrontXoProxy['id'] | undefined>) =>
      computed(() => (toValue(id) === PROXY.id ? PROXY : undefined)),
  })) as unknown as typeof useXoProxyCollection,
}))

type NewForm = ReturnType<typeof useNewBackupRepositoryForm>

const NFS_DETAILS = { host: '192.168.1.10', path: '/exports/backups' }

const SMB_DETAILS = { pathOnShare: 'nas\\backups', username: 'admin', password: 'smb-password' }

type DetailsFormData = {
  [TKey in keyof NewForm['details']]?: Partial<NewForm['details'][TKey]['formData']>
}

async function mountReviewStep({
  type = 'nfs',
  general = {},
  details = {},
}: {
  type?: BackupRepositoryType
  general?: Partial<NewForm['general']['formData']>
  details?: DetailsFormData
} = {}) {
  const form = mountComposable(() => useNewBackupRepositoryForm()).wrapper.vm

  form.general.formData.type = type
  await flushPromises()

  Object.assign(form.general.formData, { name: 'My repository', ...general })
  Object.assign(form.details.file.formData, details.file)
  Object.assign(form.details.nfs.formData, details.nfs)
  Object.assign(form.details.smb.formData, details.smb)
  Object.assign(form.details.s3.formData, details.s3)
  Object.assign(form.details.azure.formData, details.azure)
  await flushPromises()

  const wrapper = mount(NewBackupRepositoryReviewStep, {
    props: { general: form.general, details: form.details, detailsTitle: 'Details' },
    global: createGlobalTestConfig(),
  })

  const [generalSection, detailsSection] = wrapper.findAll('.section')

  return { wrapper, generalSection, detailsSection }
}

describe('general section', () => {
  it('shows the name, type, storage mode, proxy and encryption', async () => {
    const { generalSection } = await mountReviewStep({ type: 'nfs', general: { backupFormat: 'vhd' } })

    expect(findLabelledValues(generalSection)).toEqual({
      [t('name')]: 'My repository',
      [t('type')]: t('nfs'),
      [t('storage-mode')]: t('vhd-file'),
      [t('proxy')]: '',
      [t('encryption')]: t('disabled'),
    })
  })

  it('shows the block based storage mode', async () => {
    const { generalSection } = await mountReviewStep({ type: 's3' })

    expect(findLabelledValues(generalSection)).toMatchObject({ [t('storage-mode')]: t('block-based') })
  })

  it('shows the name of the selected proxy', async () => {
    const { generalSection } = await mountReviewStep({ general: { proxy: PROXY.id } })

    expect(findLabelledValues(generalSection)).toMatchObject({ [t('proxy')]: PROXY.name })
  })

  it('shows the encryption as enabled, without showing its key', async () => {
    const encryptionKey = '0123456789abcdef0123456789abcdef'
    const { wrapper, generalSection } = await mountReviewStep({
      type: 's3',
      general: { encrypted: true, encryptionKey },
    })

    expect(findLabelledValues(generalSection)).toMatchObject({ [t('encryption')]: t('enabled') })
    expect(wrapper.text()).not.toContain(encryptionKey)
  })
})

describe('details section', () => {
  it('is titled after the given details title', async () => {
    const { detailsSection } = await mountReviewStep()

    expect(detailsSection.get('.ui-title .label').text()).toBe('Details')
  })

  it('shows the path of a local repository', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'file',
      details: { file: { path: '/var/lib/xoa/backups' } },
    })

    expect(findLabelledValues(detailsSection)).toEqual({ [t('path')]: '/var/lib/xoa/backups' })
  })

  it('shows the host, port, path and custom options of an NFS repository', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'nfs',
      details: { nfs: { ...NFS_DETAILS, port: '2050', customOptions: 'vers=4' } },
    })

    expect(findLabelledValues(detailsSection)).toEqual({
      [t('host')]: '192.168.1.10',
      [t('port')]: '2050',
      [t('path-on-share')]: '/exports/backups',
      [t('custom-options')]: 'vers=4',
    })
  })

  it('shows the default NFS port when none is given', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'nfs',
      details: { nfs: NFS_DETAILS },
    })

    expect(findLabelledValues(detailsSection)).toMatchObject({ [t('port')]: NFS_DEFAULT_PORT })
  })

  it('shows the share with its subfolder, the credentials and the domain of an SMB repository', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'smb',
      details: {
        smb: {
          ...SMB_DETAILS,
          subfolder: 'xo',
          domain: 'CORP',
          customOptions: 'vers=3.0',
        },
      },
    })

    expect(findLabelledValues(detailsSection)).toEqual({
      [t('path-on-share')]: '\\\\nas\\backups\\xo',
      [t('username')]: 'admin',
      [t('password')]: MASKED_SECRET,
      [t('domain')]: 'CORP',
      [t('custom-options')]: 'vers=3.0',
    })
  })

  it('shows the share alone, and the default SMB domain, when no subfolder nor domain is given', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'smb',
      details: { smb: SMB_DETAILS },
    })

    expect(findLabelledValues(detailsSection)).toMatchObject({
      [t('path-on-share')]: '\\\\nas\\backups',
      [t('domain')]: SMB_DEFAULT_DOMAIN,
    })
  })

  it('shows the endpoint, security settings, credentials, bucket and path of an S3 repository', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 's3',
      details: {
        s3: {
          endpoint: 's3.us-east-2.amazonaws.com',
          useHttps: true,
          allowUnauthorized: true,
          region: 'us-east-2',
          accessKeyId: 'access-key',
          secret: 's3-secret',
          bucket: 'backups',
          pathInBucket: 'xo',
        },
      },
    })

    expect(findLabelledValues(detailsSection)).toEqual({
      [t('endpoint-url')]: 's3.us-east-2.amazonaws.com',
      [t('https')]: t('enabled'),
      [t('unauthorized')]: t('enabled'),
      [t('region')]: 'us-east-2',
      [t('access-key-id')]: 'access-key',
      [t('secret')]: MASKED_SECRET,
      [t('bucket-name')]: 'backups',
      [t('path-in-bucket')]: 'xo',
    })
  })

  it('leaves the unauthorized certificates out for an S3 repository over HTTP', async () => {
    const { detailsSection } = await mountReviewStep({ type: 's3', details: { s3: { useHttps: false } } })

    const labelledValues = findLabelledValues(detailsSection)

    expect(labelledValues).toMatchObject({ [t('https')]: t('disabled') })
    expect(labelledValues).not.toHaveProperty(t('unauthorized'))
  })

  it('shows the host, credentials, container and path of an Azure repository, without the HTTPS setting', async () => {
    const { detailsSection } = await mountReviewStep({
      type: 'azure',
      details: {
        azure: {
          hostName: 'account.blob.core.windows.net',
          accountName: 'account',
          key: 'azure-key',
          containerName: 'backups',
          pathInContainer: 'xo',
        },
      },
    })

    expect(findLabelledValues(detailsSection)).toEqual({
      [t('host')]: 'account.blob.core.windows.net',
      [t('account-name')]: 'account',
      [t('key')]: MASKED_SECRET,
      [t('container-name')]: 'backups',
      [t('path-in-container')]: 'xo',
    })
  })

  it('shows the HTTPS setting of an Azurite repository', async () => {
    const { detailsSection } = await mountReviewStep({ type: 'azurite', details: { azure: { useHttps: false } } })

    expect(findLabelledValues(detailsSection)).toMatchObject({ [t('https')]: t('disabled') })
  })

  it('never shows a secret', async () => {
    const { wrapper } = await mountReviewStep({
      type: 'smb',
      details: { smb: SMB_DETAILS },
    })

    expect(wrapper.text()).not.toContain(SMB_DETAILS.password)
  })

  it('leaves a secret empty, rather than masked, when none is given', async () => {
    const { detailsSection } = await mountReviewStep({ type: 'smb' })

    expect(findLabelledValues(detailsSection)).toMatchObject({ [t('password')]: '' })
  })
})

describe('edit', () => {
  it('asks to edit the general step from the general section', async () => {
    const { wrapper, generalSection } = await mountReviewStep()

    await generalSection.get('.ui-title button').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([['general']])
  })

  it('asks to edit the details step from the details section', async () => {
    const { wrapper, detailsSection } = await mountReviewStep()

    await detailsSection.get('.ui-title button').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([['details']])
  })
})
