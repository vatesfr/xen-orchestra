import BackupRepositorySmbCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySmbCard.vue'
import { MASKED_SECRET } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
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
  return mount(BackupRepositorySmbCard, {
    props: { smb, options },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('smb'))
})

it('shows the share path, credentials, domain and formatted mount options', () => {
  const wrapper = mountCard(createSmbUrl(), 'vers=3.0, ,soft')

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('path-on-share')]: '192.168.100.10\\share\\backups',
    [t('username')]: 'admin',
    [t('password')]: MASKED_SECRET,
    [t('domain')]: 'WORKGROUP',
    [t('custom-options')]: 'vers=3.0, soft',
  })
})

it('never shows nor offers to copy the password', () => {
  const wrapper = mountCard(createSmbUrl({ password: 'p4ssw0rd' }))

  expect(wrapper.text()).not.toContain('p4ssw0rd')
  expect(findCardCopiedValues(wrapper)).not.toContain('p4ssw0rd')
})

it('offers to copy each visible value as it is shown', () => {
  const wrapper = mountCard(createSmbUrl(), 'vers=3.0, ,soft')

  expect(findCardCopiedValues(wrapper)).toEqual([
    '192.168.100.10\\share\\backups',
    'admin',
    'WORKGROUP',
    'vers=3.0, soft',
  ])
})

it('leaves the mount options empty and not copyable when there are none', () => {
  const wrapper = mountCard(createSmbUrl(), undefined)

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('custom-options')]: '' })
  expect(findCardCopiedValues(wrapper)).toEqual(['192.168.100.10\\share\\backups', 'admin', 'WORKGROUP'])
})
