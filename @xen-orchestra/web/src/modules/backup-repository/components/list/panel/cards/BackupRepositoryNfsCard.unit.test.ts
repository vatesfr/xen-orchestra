import BackupRepositoryNfsCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryNfsCard.vue'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedNfsBackupRepositoryUrl } from 'xo-remote-parser'

function createNfsUrl(overrides: Partial<ParsedNfsBackupRepositoryUrl> = {}): ParsedNfsBackupRepositoryUrl {
  return { type: 'nfs', host: '192.168.100.225', port: '2049', path: '/media/nfs', ...overrides }
}

function mountCard(nfs = createNfsUrl(), options?: string) {
  return mount(BackupRepositoryNfsCard, {
    props: { nfs, options },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('nfs'))
})

it('shows the host, port, path and formatted mount options of the share', () => {
  const wrapper = mountCard(createNfsUrl(), 'vers=3, soft ,')

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('host')]: '192.168.100.225',
    [t('port')]: '2049',
    [t('path-on-share')]: '/media/nfs',
    [t('custom-options')]: 'vers=3, soft',
  })
})

it('offers to copy each value as it is shown', () => {
  const wrapper = mountCard(createNfsUrl(), 'vers=3, soft ,')

  expect(findCardCopiedValues(wrapper)).toEqual(['192.168.100.225', '2049', '/media/nfs', 'vers=3, soft'])
})

it('leaves the port empty and not copyable when the url has none', () => {
  const wrapper = mountCard(createNfsUrl({ port: undefined }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('port')]: '' })
  expect(findCardCopiedValues(wrapper)).toEqual(['192.168.100.225', '/media/nfs'])
})

it('leaves the mount options empty and not copyable when there are none', () => {
  const wrapper = mountCard(createNfsUrl(), undefined)

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('custom-options')]: '' })
  expect(findCardCopiedValues(wrapper)).toEqual(['192.168.100.225', '2049', '/media/nfs'])
})
