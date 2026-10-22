import { useXoBackupRepositoryUtils } from '@/modules/backup-repository/composables/use-xo-backup-repository-utils.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { XoProxy } from '@vates/types'
import { computed, ref, toValue } from 'vue'
import { useI18n } from 'vue-i18n'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const { useGetProxyById } = vi.hoisted(() => ({
  useGetProxyById: vi.fn(),
}))

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ useGetProxyById })) as unknown as typeof useXoProxyCollection,
}))

beforeEach(() => {
  useGetProxyById.mockReset()

  useGetProxyById.mockReturnValue(computed(() => undefined))
})

function mountUtils(br: FrontXoBackupRepository = createBr()) {
  return mountComposable(() => {
    const { t } = useI18n()

    return { ...useXoBackupRepositoryUtils(br, parseBackupRepositoryUrl(br.url)), t }
  }).wrapper.vm
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
    const proxy = { id: 'proxy-1' as XoProxy['id'], name: 'Remote site proxy' }
    useGetProxyById.mockImplementation(id => computed(() => (toValue(id) === proxy.id ? proxy : undefined)))

    expect(mountUtils(createBr({ proxy: proxy.id })).brProxy).toEqual(proxy)
  })

  it('reacts to changes of the source repository', () => {
    const br = ref(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))
    const { wrapper } = mountComposable(() => {
      const { t } = useI18n()

      return {
        ...useXoBackupRepositoryUtils(br, () => parseBackupRepositoryUrl(br.value.url)),
        t,
      }
    })

    br.value = createBr({ enabled: false, url: 's3://key:secret@s3.us-west-1.amazonaws.com/my-bucket/backups' })

    expect(wrapper.vm.brStatus).toBe('disabled')
    expect(wrapper.vm.brType).toBe(wrapper.vm.t('s3'))
  })
})
