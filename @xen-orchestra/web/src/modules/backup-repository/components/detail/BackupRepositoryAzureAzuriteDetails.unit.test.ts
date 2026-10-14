import BackupRepositoryAzureAzuriteDetails from '@/modules/backup-repository/components/detail/BackupRepositoryAzureAzuriteDetails.vue'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedAzureBackupRepositoryUrl } from 'xo-remote-parser'

function createAzureUrl(overrides: Partial<ParsedAzureBackupRepositoryUrl> = {}): ParsedAzureBackupRepositoryUrl {
  return {
    type: 'azure',
    protocol: 'https',
    host: 'myaccount.blob.core.windows.net',
    port: '443',
    path: '/my-container/backups/xo',
    username: 'myaccount',
    password: 'azure-account-key',
    ...overrides,
  }
}

function createAzuriteUrl(overrides: Partial<ParsedAzureBackupRepositoryUrl> = {}): ParsedAzureBackupRepositoryUrl {
  return createAzureUrl({
    type: 'azurite',
    host: '127.0.0.1',
    port: '10000',
    username: 'devstoreaccount1',
    password: 'azurite-account-key',
    ...overrides,
  })
}

function mountCard(azure = createAzureUrl()) {
  return mount(BackupRepositoryAzureAzuriteDetails, {
    props: { azure },
    global: createGlobalTestConfig(),
  })
}

describe('azure', () => {
  it('renders the card title', () => {
    const wrapper = mountCard()

    expect(wrapper.get('.ui-title .label').text()).toBe(t('azure'))
  })

  it('shows the host, account, container and path in container, without the https row', () => {
    const wrapper = mountCard()

    expect(findLabelledValues(wrapper)).toEqual({
      [t('host')]: 'myaccount.blob.core.windows.net',
      [t('account-name')]: 'myaccount',
      [t('key')]: MASKED_SECRET,
      [t('container-name')]: 'my-container',
      [t('path')]: '/backups/xo',
    })
  })
})

describe('azurite', () => {
  it('renders the card title', () => {
    const wrapper = mountCard(createAzuriteUrl())

    expect(wrapper.get('.ui-title .label').text()).toBe(t('azurite'))
  })

  it('shows the host, https, account, container and path in container', () => {
    const wrapper = mountCard(createAzuriteUrl())

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
})

it('never shows the account key', () => {
  const azure = mountCard(createAzureUrl({ password: 'azure-account-key' }))
  const azurite = mountCard(createAzuriteUrl({ password: 'azurite-account-key' }))

  expect(azure.text()).not.toContain('azure-account-key')
  expect(azurite.text()).not.toContain('azurite-account-key')
})

it('shows / as path in container when the path is only the container', () => {
  const wrapper = mountCard(createAzureUrl({ path: '/my-container' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('container-name')]: 'my-container', [t('path')]: '/' })
})
