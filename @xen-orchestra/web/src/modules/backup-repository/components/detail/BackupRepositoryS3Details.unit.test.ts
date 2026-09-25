import BackupRepositoryS3Details from '@/modules/backup-repository/components/detail/BackupRepositoryS3Details.vue'
import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { ParsedS3BackupRepositoryUrl } from 'xo-remote-parser'

function createS3Url(overrides: Partial<ParsedS3BackupRepositoryUrl> = {}): ParsedS3BackupRepositoryUrl {
  return {
    type: 's3',
    protocol: 'https',
    host: 's3.us-west-1.amazonaws.com',
    path: '/my-bucket/backups/xo',
    region: 'us-west-1',
    username: 'AKIAIOSFODNN7',
    password: 'wJalrXUtnFEMI',
    ...overrides,
  }
}

function mountCard(s3 = createS3Url()) {
  return mount(BackupRepositoryS3Details, {
    props: { s3 },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-title .label').text()).toBe(t('s3'))
})

it('shows the endpoint, security settings, credentials, bucket and path in bucket', () => {
  const wrapper = mountCard()

  expect(findLabelledValues(wrapper)).toEqual({
    [t('endpoint-url')]: 's3.us-west-1.amazonaws.com',
    [t('https')]: t('enabled'),
    [t('accept-self-signed-certificates')]: t('disabled'),
    [t('region')]: 'us-west-1',
    [t('access-key-id')]: 'AKIAIOSFODNN7',
    [t('secret')]: MASKED_SECRET,
    [t('bucket-name')]: 'my-bucket',
    [t('path-in-bucket')]: '/backups/xo',
  })
})

it('shows https as disabled for an http endpoint', () => {
  const wrapper = mountCard(createS3Url({ protocol: 'http' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('https')]: t('disabled') })
})

it('shows self-signed certificates as accepted when the url allows them', () => {
  const wrapper = mountCard(createS3Url({ allowUnauthorized: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('accept-self-signed-certificates')]: t('enabled') })
})

it('never shows the secret', () => {
  const wrapper = mountCard(createS3Url({ password: 'wJalrXUtnFEMI' }))

  expect(wrapper.text()).not.toContain('wJalrXUtnFEMI')
})

it('shows / as path in bucket when the path is only the bucket', () => {
  const wrapper = mountCard(createS3Url({ path: '/my-bucket' }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('bucket-name')]: 'my-bucket', [t('path-in-bucket')]: '/' })
})

it('leaves the region empty when the url has none', () => {
  const wrapper = mountCard(createS3Url({ region: undefined }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('region')]: '' })
})
