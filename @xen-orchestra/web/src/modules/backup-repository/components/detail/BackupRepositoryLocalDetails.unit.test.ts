import BackupRepositoryLocalDetails from '@/modules/backup-repository/components/detail/BackupRepositoryLocalDetails.vue'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedFileBackupRepositoryUrl } from 'xo-remote-parser'

function createFileUrl(overrides: Partial<ParsedFileBackupRepositoryUrl> = {}): ParsedFileBackupRepositoryUrl {
  return { type: 'file', path: '/var/lib/xo/backups', ...overrides }
}

function mountCard(file = createFileUrl()) {
  return mount(BackupRepositoryLocalDetails, {
    props: { file },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('local'))
})

it('shows the path of the repository', () => {
  const wrapper = mountCard(createFileUrl({ path: '/mnt/backups' }))

  expect(findLabelledValues(wrapper)).toEqual({ [t('path')]: '/mnt/backups' })
})
