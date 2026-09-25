import BackupRepositoryAzuriteDetails from '@/modules/backup-repository/components/detail/BackupRepositoryAzuriteDetails.vue'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedAzureBackupRepositoryUrl } from 'xo-remote-parser'

function createAzuriteUrl(overrides: Partial<ParsedAzureBackupRepositoryUrl> = {}): ParsedAzureBackupRepositoryUrl {
  return {
    type: 'azurite',
    protocol: 'https',
    host: '127.0.0.1',
    port: '10000',
    path: '/my-container/backups/xo',
    username: 'devstoreaccount1',
    password: 'azurite-account-key',
    ...overrides,
  }
}

function mountCard(azurite = createAzuriteUrl()) {
  return mount(BackupRepositoryAzuriteDetails, {
    props: { azurite },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('azurite'))
})

it('shows the host, https, account, container and path in container', () => {
  const wrapper = mountCard()

  expect(findLabelledValues(wrapper)).toEqual({
    [t('host')]: '127.0.0.1',
    [t('https')]: t('enabled'),
    [t('account-name')]: 'devstoreaccount1',
    [t('key')]: MASKED_SECRET,
    [t('container-name')]: 'my-container',
    [t('path')]: '/backups/xo',
  })
})

it('shows https as disabled for an http endpoint', () => {
  const wrapper = mountCard(createAzuriteUrl({ protocol: 'http' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('https')]: t('disabled') })
})

it('never shows the account key', () => {
  const wrapper = mountCard(createAzuriteUrl({ password: 'azurite-account-key' }))

  expect(wrapper.text()).not.toContain('azurite-account-key')
})

it('shows / as path in container when the path is only the container', () => {
  const wrapper = mountCard(createAzuriteUrl({ path: '/my-container' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('container-name')]: 'my-container', [t('path')]: '/' })
})
