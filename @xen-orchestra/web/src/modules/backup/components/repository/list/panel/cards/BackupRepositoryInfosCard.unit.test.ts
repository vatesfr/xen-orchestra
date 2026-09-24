import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryInfosCard.vue'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createBr } from '@/test/create-br.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import type { XoProxy } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const { useGetProxyById, buildXo5Route } = vi.hoisted(() => ({
  useGetProxyById: vi.fn(),
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({ useGetProxyById })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  useGetProxyById.mockReset()
  buildXo5Route.mockReset()

  useGetProxyById.mockReturnValue(computed(() => undefined))
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
})

function mountCard(br: FrontXoBackupRepository = createBr()) {
  return mount(BackupRepositoryInfosCard, {
    props: { br, parsedBrUrl: parseBackupRepositoryUrl(br.url) },
    global: createGlobalTestConfig(),
  })
}

it('renders the name and the id of the repository as the card title', () => {
  const wrapper = mountCard(createBr({ name: 'Nightly backups', id: 'br-42' as FrontXoBackupRepository['id'] }))

  expect(wrapper.get('.vts-card-object-title').text()).toContain('Nightly backups')
  expect(wrapper.get('.vts-card-object-title').text()).toContain('br-42')
})

it('links the title to the backup repositories settings of XO 5', () => {
  const wrapper = mountCard()

  expect(wrapper.findComponent(VtsCardObjectTitle).findComponent(UiLink).props('href')).toBe(
    'https://xo5.example.com/#/settings/remotes'
  )
})

it('picks the title icon from the status of the repository', () => {
  const wrapper = mountCard(createBr({ error: { code: 'ENOENT' } }))

  expect(wrapper.findComponent(VtsCardObjectTitle).props('icon')).toBe(objectIcon('br', 'disconnected'))
})

it('lists every row of the card, in order', () => {
  const wrapper = mountCard()

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual([
    t('status'),
    t('type'),
    t('storage-mode'),
    t('proxy'),
    t('encryption'),
  ])
})

it('shows the status, type, storage mode and encryption of a plain repository', () => {
  const wrapper = mountCard(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('status')]: t('enabled'),
    [t('type')]: t('nfs'),
    [t('storage-mode')]: t('file-based'),
    [t('proxy')]: '',
    [t('encryption')]: t('disabled'),
  })
})

it('shows a disabled repository as disabled', () => {
  const wrapper = mountCard(createBr({ enabled: false }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('disabled') })
})

it('shows an enabled repository with an error as unable to connect', () => {
  const wrapper = mountCard(createBr({ error: { code: 'ENOENT' } }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('status')]: t('unable-to-connect') })
})

it('shows the block based storage mode and the encryption of an encrypted repository', () => {
  const wrapper = mountCard(
    createBr({ url: 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true&encryptionKey=%22secret%22' })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('storage-mode')]: t('block-based'),
    [t('encryption')]: t('enabled'),
  })
})

it('shows an unrecognized url as unknown type and storage mode, and does not offer to copy the type', () => {
  const wrapper = mountCard(createBr({ url: 'ftp://192.168.100.225/backup' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('type')]: t('unknown'),
    [t('storage-mode')]: t('unknown'),
  })
  expect(findCardCopiedValues(wrapper)).toEqual([t('unknown')])
})

it('shows the proxy the repository goes through and offers to copy its name', () => {
  const proxy = { id: 'proxy-1' as XoProxy['id'], name: 'Remote site proxy' }
  useGetProxyById.mockReturnValue(computed(() => proxy))

  const wrapper = mountCard(createBr({ proxy: proxy.id }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('proxy')]: 'Remote site proxy' })
  expect(findCardCopiedValues(wrapper)).toContain('Remote site proxy')
})

it('offers to copy the type and the storage mode as they are shown', () => {
  const wrapper = mountCard(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))

  expect(findCardCopiedValues(wrapper)).toEqual([t('nfs'), t('file-based')])
})
