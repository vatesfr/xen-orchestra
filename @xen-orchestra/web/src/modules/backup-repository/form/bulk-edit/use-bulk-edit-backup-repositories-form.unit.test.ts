import { useBulkEditBackupRepositoriesForm } from '@/modules/backup-repository/form/bulk-edit/use-bulk-edit-backup-repositories-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { OBFUSCATED_VALUE } from '@vates/obfuscate'
import { ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([{ id: 'proxy-1', name: 'Proxy 1' }]),
  })) as unknown as typeof useXoProxyCollection,
}))

const ENCRYPTED_NFS_BR = createBr({
  id: 'backup-repository-1' as FrontXoBackupRepository['id'],
  name: 'Nightly backups',
  url: `nfs://192.168.1.10:2049:/exports/nightly?useVhdDirectory=true&encryptionKey=%22${OBFUSCATED_VALUE}%22`,
  proxy: PROXY_ID,
  options: 'vers=3',
})

const VHD_NFS_BR = createBr({
  id: 'backup-repository-2' as FrontXoBackupRepository['id'],
  name: 'Weekly backups',
  url: 'nfs://192.168.1.10:2049:/exports/weekly',
  proxy: undefined,
  options: 'vers=3',
})

const S3_BR = createBr({
  id: 'backup-repository-3' as FrontXoBackupRepository['id'],
  name: 'Offsite backups',
  url: 's3+http://AKID:secret@minio.local:9000/bucket?compressionType=zstd',
  proxy: undefined,
})

function mountBulkEditForm(brs: FrontXoBackupRepository[]) {
  return mountComposable(() => useBulkEditBackupRepositoriesForm(brs)).wrapper.vm
}

describe('formData', () => {
  it('fills the values shared by the repositories, and the mixed value for the ones which differ', () => {
    const form = mountBulkEditForm([ENCRYPTED_NFS_BR, VHD_NFS_BR])

    expect(form.general.formData).toMatchObject({
      name: t('mixed-value'),
      type: 'nfs',
      backupFormat: undefined,
      proxy: undefined,
    })
    expect(form.details.nfs.formData).toEqual({
      host: '192.168.1.10',
      port: '2049',
      path: t('mixed-value'),
      customOptions: 'vers=3',
    })
  })

  it('shows "None" as the proxy of repositories which all have none', () => {
    const form = mountBulkEditForm([
      VHD_NFS_BR,
      { ...VHD_NFS_BR, id: 'backup-repository-4' as FrontXoBackupRepository['id'] },
    ])

    expect(form.general.formData.proxy).toBeNull()
  })

  it('detects repositories of different types', () => {
    expect(mountBulkEditForm([ENCRYPTED_NFS_BR, S3_BR]).hasMixedTypes).toBe(true)
    expect(mountBulkEditForm([ENCRYPTED_NFS_BR, VHD_NFS_BR]).hasMixedTypes).toBe(false)
  })
})

describe('validateAndBuildPayloads', () => {
  it('keeps each repository as is when nothing is changed', async () => {
    const payloads = await mountBulkEditForm([ENCRYPTED_NFS_BR, VHD_NFS_BR]).validateAndBuildPayloads()

    const encryptedPayload = payloads?.get(ENCRYPTED_NFS_BR.id)
    const vhdPayload = payloads?.get(VHD_NFS_BR.id)

    expect(encryptedPayload).toMatchObject({ name: 'Nightly backups', options: 'vers=3', proxy: PROXY_ID })
    expect(parseBackupRepositoryUrl(encryptedPayload!.url)).toEqual({
      type: 'nfs',
      host: '192.168.1.10',
      port: '2049',
      path: '/exports/nightly',
      useVhdDirectory: true,
      encryptionKey: OBFUSCATED_VALUE,
    })

    expect(vhdPayload).toMatchObject({ name: 'Weekly backups', options: 'vers=3', proxy: null })
    expect(parseBackupRepositoryUrl(vhdPayload!.url)).toEqual({
      type: 'nfs',
      host: '192.168.1.10',
      port: '2049',
      path: '/exports/weekly',
    })
  })

  it('applies the changes to every repository, keeping what is left mixed', async () => {
    const form = mountBulkEditForm([ENCRYPTED_NFS_BR, VHD_NFS_BR])
    form.general.formData.name = 'Backups'
    form.general.formData.proxy = null
    form.details.nfs.formData.host = '192.168.1.20'

    const payloads = await form.validateAndBuildPayloads()

    expect(
      [...(payloads?.values() ?? [])].map(payload => ({
        name: payload.name,
        proxy: payload.proxy,
        ...parseBackupRepositoryUrl(payload.url),
      }))
    ).toEqual([
      expect.objectContaining({ name: 'Backups', proxy: null, host: '192.168.1.20', path: '/exports/nightly' }),
      expect.objectContaining({ name: 'Backups', proxy: null, host: '192.168.1.20', path: '/exports/weekly' }),
    ])
  })

  it('keeps the url and the options of repositories of different types', async () => {
    const form = mountBulkEditForm([ENCRYPTED_NFS_BR, S3_BR])
    form.general.formData.proxy = null

    const payloads = await form.validateAndBuildPayloads()

    expect(payloads?.get(ENCRYPTED_NFS_BR.id)).toMatchObject({
      url: ENCRYPTED_NFS_BR.url,
      options: 'vers=3',
      proxy: null,
    })
    expect(payloads?.get(S3_BR.id)).toMatchObject({ url: S3_BR.url, options: null, proxy: null })
  })

  it('builds no payload when the form is invalid', async () => {
    const form = mountBulkEditForm([ENCRYPTED_NFS_BR, VHD_NFS_BR])
    form.general.formData.name = ''

    expect(await form.validateAndBuildPayloads()).toBeUndefined()
  })
})
