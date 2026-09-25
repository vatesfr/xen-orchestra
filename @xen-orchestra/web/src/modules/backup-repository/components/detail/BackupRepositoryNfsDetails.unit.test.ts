import BackupRepositoryNfsDetails from '@/modules/backup-repository/components/detail/BackupRepositoryNfsDetails.vue'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedNfsBackupRepositoryUrl } from 'xo-remote-parser'

function createNfsUrl(overrides: Partial<ParsedNfsBackupRepositoryUrl> = {}): ParsedNfsBackupRepositoryUrl {
  return { type: 'nfs', host: '192.168.100.225', port: '2049', path: '/media/nfs', ...overrides }
}

function mountCard(nfs = createNfsUrl(), options?: string) {
  return mount(BackupRepositoryNfsDetails, {
    props: { nfs, options },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('nfs'))
})

it('shows the host, port, path and formatted mount options of the share', () => {
  const wrapper = mountCard(createNfsUrl(), 'vers=3, soft ,')

  expect(findLabelledValues(wrapper)).toEqual({
    [t('host')]: '192.168.100.225',
    [t('port')]: '2049',
    [t('path-on-share')]: '/media/nfs',
    [t('custom-options')]: 'vers=3, soft',
  })
})

it('leaves the port empty when the url has none', () => {
  const wrapper = mountCard(createNfsUrl({ port: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('port')]: '' })
})

it('leaves the mount options empty when there are none', () => {
  const wrapper = mountCard(createNfsUrl(), undefined)

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('custom-options')]: '' })
})
