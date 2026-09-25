import BackupRepositorySmbDetails from '@/modules/backup-repository/components/detail/BackupRepositorySmbDetails.vue'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedSmbBackupRepositoryUrl } from 'xo-remote-parser'

function createSmbUrl(overrides: Partial<ParsedSmbBackupRepositoryUrl> = {}): ParsedSmbBackupRepositoryUrl {
  return {
    type: 'smb',
    host: '192.168.100.10',
    path: 'share\\backups',
    domain: 'WORKGROUP',
    username: 'admin',
    password: 'p4ssw0rd',
    ...overrides,
  }
}

function mountCard(smb = createSmbUrl(), options?: string) {
  return mount(BackupRepositorySmbDetails, {
    props: { smb, options },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('smb'))
})

it('shows the UNC share path, credentials, domain and formatted mount options', () => {
  const wrapper = mountCard(createSmbUrl(), 'vers=3.0, ,soft')

  expect(findLabelledValues(wrapper)).toEqual({
    [t('path-on-share')]: '\\\\192.168.100.10\\share\\backups',
    [t('username')]: 'admin',
    [t('password')]: MASKED_SECRET,
    [t('domain')]: 'WORKGROUP',
    [t('custom-options')]: 'vers=3.0, soft',
  })
})

it('shows only the host as share path when the url has no path', () => {
  const wrapper = mountCard(createSmbUrl({ path: '' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('path-on-share')]: '\\\\192.168.100.10' })
})

it('never shows the password', () => {
  const wrapper = mountCard(createSmbUrl({ password: 'p4ssw0rd' }))

  expect(wrapper.text()).not.toContain('p4ssw0rd')
})

it('hides the password row when the url has no password', () => {
  const wrapper = mountCard(createSmbUrl({ password: '' }))

  expect(findLabelledValues(wrapper)).not.toHaveProperty(t('password'))
})

it('leaves the mount options empty when there are none', () => {
  const wrapper = mountCard(createSmbUrl(), undefined)

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('custom-options')]: '' })
})
