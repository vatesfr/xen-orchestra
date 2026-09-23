import BackupRepositoryAzureAzuriteCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryAzureAzuriteCard.vue'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-labelled-values.ts'
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

function mountCard(azure = createAzureUrl()) {
  return mount(BackupRepositoryAzureAzuriteCard, {
    props: { azure },
    global: createGlobalTestConfig(),
  })
}

describe('azure', () => {
  it('renders the azure card title', () => {
    const wrapper = mountCard()

    expect(wrapper.get('.ui-card-title').text()).toBe(t('azure'))
  })

  it('shows the host, account, container and path in container, without the https row', () => {
    const wrapper = mountCard()

    expect(findCardLabelledValues(wrapper)).toEqual({
      [t('host')]: 'myaccount.blob.core.windows.net',
      [t('account-name')]: 'myaccount',
      [t('key')]: MASKED_SECRET,
      [t('container-name')]: 'my-container',
      [t('path')]: '/backups/xo',
    })
  })
})

describe('azurite', () => {
  it('renders the azurite card title', () => {
    const wrapper = mountCard(createAzureUrl({ type: 'azurite' }))

    expect(wrapper.get('.ui-card-title').text()).toBe(t('azurite'))
  })

  it('shows whether the endpoint uses https', () => {
    expect(findCardLabelledValues(mountCard(createAzureUrl({ type: 'azurite', protocol: 'https' })))).toMatchObject({
      [t('https')]: t('enabled'),
    })
    expect(findCardLabelledValues(mountCard(createAzureUrl({ type: 'azurite', protocol: 'http' })))).toMatchObject({
      [t('https')]: t('disabled'),
    })
  })
})

it('never shows nor offers to copy the account key', () => {
  const wrapper = mountCard(createAzureUrl({ password: 'azure-account-key' }))

  expect(wrapper.text()).not.toContain('azure-account-key')
  expect(findCardCopiedValues(wrapper)).not.toContain('azure-account-key')
})

it('shows / as path in container when the path is only the container', () => {
  const wrapper = mountCard(createAzureUrl({ path: '/my-container' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('container-name')]: 'my-container', [t('path')]: '/' })
})

it('offers to copy each visible value as it is shown', () => {
  const wrapper = mountCard()

  expect(findCardCopiedValues(wrapper)).toEqual([
    'myaccount.blob.core.windows.net',
    'myaccount',
    'my-container',
    '/backups/xo',
  ])
})
