import { useXoBackupRepositoryUtils } from '@/modules/backup-repository/composables/use-xo-backup-repository-utils.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createProxy } from '@/test/create-proxy.ts'
import { proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

mockModule(
  import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'),
  () => import('@/test/mock-xo-proxy-collection.ts')
)

beforeEach(() => {
  proxyCollectionMock.reset()
})

function mountUtils(br: FrontXoBackupRepository = createBr()) {
  return mountComposableWithI18n(() => useXoBackupRepositoryUtils(br, parseBackupRepositoryUrl(br.url)))
}

describe('useXoBackupRepositoryUtils', () => {
  it('describes a plain enabled repository', () => {
    const result = mountUtils(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))

    expect({
      brStatus: result.brStatus,
      brType: result.brType,
      brStorageMode: result.brStorageMode,
      brProxy: result.brProxy,
      isEncrypted: result.isEncrypted,
    }).toEqual({
      brStatus: 'enabled',
      brType: result.t('nfs'),
      brStorageMode: result.t('file-based'),
      brProxy: undefined,
      isEncrypted: false,
    })
  })

  it('shows a block based and encrypted repository as such', () => {
    const result = mountUtils(
      createBr({ url: 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true&encryptionKey=%22secret%22' })
    )

    expect(result.brStorageMode).toBe(result.t('block-based'))
    expect(result.isEncrypted).toBe(true)
  })

  it('falls back to unknown type and storage mode for an unrecognized url', () => {
    const result = mountUtils(createBr({ url: 'ftp://192.168.100.225/backup' }))

    expect(result.brType).toBe(result.t('unknown'))
    expect(result.brStorageMode).toBe(result.t('unknown'))
  })

  it('reflects the repository status', () => {
    expect(mountUtils(createBr({ enabled: false })).brStatus).toBe('disabled')
    expect(mountUtils(createBr({ error: { code: 'ENOENT' } })).brStatus).toBe('unable-to-connect')
  })

  it('looks up the proxy of the repository', () => {
    const proxy = createProxy({ name: 'Remote site proxy' })
    proxyCollectionMock.proxies.value = [proxy]

    expect(mountUtils(createBr({ proxy: proxy.id })).brProxy).toEqual(proxy)
  })

  it('reacts to changes of the source repository', () => {
    const br = ref(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))
    const result = mountComposableWithI18n(() =>
      useXoBackupRepositoryUtils(br, () => parseBackupRepositoryUrl(br.value.url))
    )

    br.value = createBr({ enabled: false, url: 's3://key:secret@s3.us-west-1.amazonaws.com/my-bucket/backups' })

    expect(result.brStatus).toBe('disabled')
    expect(result.brType).toBe(result.t('s3'))
  })
})
