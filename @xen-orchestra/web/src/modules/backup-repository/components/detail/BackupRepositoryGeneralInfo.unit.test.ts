import BackupRepositoryGeneralInfo from '@/modules/backup-repository/components/detail/BackupRepositoryGeneralInfo.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoProxy } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
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

function mountCard(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryGeneralInfo, {
    props: { br, parsedBrUrl: parseBackupRepositoryUrl(br.url) },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('general-information'))
})

it('shows the name, id, status, type, backup format, proxy and encryption of a plain repository', () => {
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
    [t('backup-format')]: t('file-based'),
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

it('shows the block based backup format and the encryption of an encrypted repository', () => {
  const wrapper = mountCard(
    createBr({ url: 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true&encryptionKey=%22secret%22' })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('backup-format')]: t('block-based'),
    [t('encryption')]: t('enabled'),
  })
})

it('shows an unrecognized url as unknown type and backup format', () => {
  const wrapper = mountCard(createBr({ url: 'ftp://192.168.100.225/backup' }))

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('type')]: t('unknown'),
    [t('backup-format')]: t('unknown'),
  })
})

it('shows the proxy the repository goes through', () => {
  const proxy = { id: 'proxy-1' as XoProxy['id'], name: 'Remote site proxy' }
  useGetProxyById.mockReturnValue(computed(() => proxy))

  const wrapper = mountCard(createBr({ proxy: proxy.id }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('proxy')]: 'Remote site proxy' })
})
