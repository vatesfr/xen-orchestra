import { useEditBackupRepositoryForm } from '@/modules/backup-repository/form/use-edit-backup-repository-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoProxy, useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const PROXY_ID = 'proxy-1' as FrontXoProxy['id']

const OBFUSCATED_VALUE = 'obfuscated-q3oi6d9X8uenGvdLnHk2'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([{ id: 'proxy-1', name: 'Proxy 1' }]),
  })) as unknown as typeof useXoProxyCollection,
}))

const ENCRYPTED_NFS_BR = createBr({
  name: 'Nightly backups',
  url: `nfs://192.168.1.10:2049:/exports/backups?useVhdDirectory=true&encryptionKey=%22${OBFUSCATED_VALUE}%22`,
  proxy: PROXY_ID,
  options: 'vers=3',
})

function mountEditForm(br: FrontXoBackupRepository = ENCRYPTED_NFS_BR) {
  return mountComposable(() => useEditBackupRepositoryForm(() => br)).wrapper.vm
}

describe('formData', () => {
  it('fills the general information from the repository', () => {
    const form = mountEditForm()

    expect(form.general.formData).toEqual({
      name: 'Nightly backups',
      type: 'nfs',
      backupFormat: 'block',
      proxy: PROXY_ID,
      encrypted: true,
      encryptionKey: OBFUSCATED_VALUE,
    })
  })

  it('uses the VHD format, without encryption, for a repository not storing its backups in VHD directories', () => {
    const form = mountEditForm(createBr({ url: 'nfs://192.168.1.10:/exports/backups' }))

    expect(form.general.formData).toMatchObject({ backupFormat: 'vhd', encrypted: false, encryptionKey: '' })
  })

  it('fills the details of the repository type', () => {
    const form = mountEditForm()

    expect(form.details.nfs.formData).toEqual({
      host: '192.168.1.10',
      port: '2049',
      path: '/exports/backups',
      customOptions: 'vers=3',
    })
  })
})

describe('validateAndBuildPayload', () => {
  it('keeps the encryption key and the VHD directories of an encrypted repository left as is', async () => {
    const payload = await mountEditForm().validateAndBuildPayload()

    expect(payload).toMatchObject({ name: 'Nightly backups', options: 'vers=3', proxy: PROXY_ID })
    expect(parseBackupRepositoryUrl(payload!.url)).toEqual({
      type: 'nfs',
      host: '192.168.1.10',
      port: '2049',
      path: '/exports/backups',
      useVhdDirectory: true,
      encryptionKey: OBFUSCATED_VALUE,
    })
  })

  it('applies the edited name and details', async () => {
    const form = mountEditForm()
    form.general.formData.name = 'Weekly backups'
    form.details.nfs.formData.host = '192.168.1.20'

    const payload = await form.validateAndBuildPayload()

    expect(payload?.name).toBe('Weekly backups')
    expect(parseBackupRepositoryUrl(payload!.url)).toMatchObject({ host: '192.168.1.20' })
  })

  it('removes the proxy and the options once they are cleared', async () => {
    const form = mountEditForm()
    form.general.formData.proxy = undefined
    form.details.nfs.formData.customOptions = ''

    expect(await form.validateAndBuildPayload()).toMatchObject({ proxy: null, options: null })
  })

  it('builds no payload when the name is empty', async () => {
    const form = mountEditForm()
    form.general.formData.name = ''

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })

  it('builds no payload for a repository with an unrecognized url', async () => {
    const form = mountEditForm(createBr({ url: 'ftp://192.168.1.10/backups' }))

    expect(await form.validateAndBuildPayload()).toBeUndefined()
  })
})
