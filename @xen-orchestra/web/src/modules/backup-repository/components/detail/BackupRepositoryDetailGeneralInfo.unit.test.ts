import BackupRepositoryDetailGeneralInfo from '@/modules/backup-repository/components/detail/BackupRepositoryDetailGeneralInfo.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { createProxy } from '@/test/create-proxy.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { mount } from '@vue/test-utils'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

mockModule(
  import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'),
  () => import('@/test/mock-xo-proxy-collection.ts')
)

beforeEach(() => {
  proxyCollectionMock.reset()
})

function mountCard(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryDetailGeneralInfo, {
    props: { br, parsedBrUrl: parseBackupRepositoryUrl(br.url) },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('general-information'))
})

it('shows the name, id, status, type, storage mode, proxy and encryption of a plain repository', () => {
  const wrapper = mountCard(
    createBr({
      name: 'Nightly backups',
      id: 'br-42' as FrontXoBackupRepository['id'],
      url: 'nfs://192.168.100.225:/media/nfs',
    })
  )

  expect(findLabelledValues(wrapper)).toEqual({
    [t('name')]: 'Nightly backups',
    [t('uuid')]: 'br-42',
    [t('status')]: t('enabled'),
    [t('type')]: t('nfs'),
    [t('storage-mode')]: t('file-based'),
    [t('proxy')]: '',
    [t('encryption')]: t('disabled'),
  })
})

it('shows a disabled repository as disabled', () => {
  const wrapper = mountCard(createBr({ enabled: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('disabled') })
})

it('shows an enabled repository with an error as unable to connect', () => {
  const wrapper = mountCard(createBr({ error: { code: 'ENOENT' } }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('unable-to-connect') })
})

it('shows the block based storage mode and the encryption of an encrypted repository', () => {
  const wrapper = mountCard(
    createBr({ url: 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true&encryptionKey=%22secret%22' })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('storage-mode')]: t('block-based'),
    [t('encryption')]: t('enabled'),
  })
})

it('shows an unrecognized url as unknown type and storage mode', () => {
  const wrapper = mountCard(createBr({ url: 'ftp://192.168.100.225/backup' }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('type')]: t('unknown'),
    [t('storage-mode')]: t('unknown'),
  })
})

it('shows the proxy the repository goes through', () => {
  const proxy = createProxy({ name: 'Remote site proxy' })
  proxyCollectionMock.proxies.value = [proxy]

  const wrapper = mountCard(createBr({ proxy: proxy.id }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('proxy')]: 'Remote site proxy' })
})
