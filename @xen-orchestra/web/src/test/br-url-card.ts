import { MASKED_SECRET } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { BR_CARD_READERS, type BrCardKind } from '@/test/br-card-kind.ts'
import {
  createAzureUrl,
  createAzuriteUrl,
  createFileUrl,
  createNfsUrl,
  createS3Url,
  createSmbUrl,
} from '@/test/create-br-url.ts'
import { findCardCopiedValues } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import type { VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'

type BrUrlCardCase<TUrl> = {
  // The prop the card takes the parsed url as
  urlProp: string
  createUrl: () => TUrl
  // Each url and the title the card gives it
  titles: { name: string; url: TUrl; title: string }[]
  // Each url (with its mount options) and the rows the card shows for it: all of them when `all`, else the ones listed;
  // in the side panel, the values it offers to copy when `copied`
  values: {
    name: string
    url: TUrl
    options?: string
    rows: Record<string, string>
    all?: boolean
    copied?: string[]
  }[]
  // Each url and the secret it holds, never shown, nor offered to copy in the side panel
  secrets: { name: string; url: TUrl; secret: string }[]
}

/**
 * Registers the tests the card of a backup repository type shares between the detail page and the side panel: the
 * title, the rows and the hidden secrets of each url of the case (`BR_NFS_URL`, `BR_SMB_URL`…). Returns the mount
 * of the card, on `case.createUrl()` by default.
 */
export function itShowsBrUrl<TUrl>(
  component: Component,
  kind: BrCardKind,
  { urlProp, createUrl, titles, values, secrets }: BrUrlCardCase<TUrl>
) {
  const { findTitle, findValues } = BR_CARD_READERS[kind]
  const mountCard = (url = createUrl(), options?: string): VueWrapper =>
    mountWithProps(component, { [urlProp]: url, ...(options === undefined ? {} : { options }) })

  it.each(titles)('$name', ({ url, title }) => {
    expect(findTitle(mountCard(url))).toBe(title)
  })

  it.each(values)('$name', ({ url, options, rows, all }) => {
    const shown = findValues(mountCard(url, options))

    if (all) {
      expect(shown).toEqual(rows)
    } else {
      expect(shown).toMatchObject(rows)
    }
  })

  it.each(secrets)('$name', ({ url, secret }) => {
    expect(mountCard(url).text()).not.toContain(secret)
  })

  if (kind === 'panel') {
    it.each(values.filter(row => row.copied !== undefined))(
      '$name, and offers to copy them',
      ({ url, options, copied }) => {
        expect(findCardCopiedValues(mountCard(url, options))).toEqual(copied)
      }
    )

    it.each(secrets)('$name, nor offers to copy it', ({ url, secret }) => {
      expect(findCardCopiedValues(mountCard(url))).not.toContain(secret)
    })
  }

  return mountCard
}

export const BR_NFS_URL: BrUrlCardCase<ReturnType<typeof createNfsUrl>> = {
  urlProp: 'nfs',
  createUrl: createNfsUrl,
  titles: [{ name: 'renders the card title', url: createNfsUrl(), title: t('nfs') }],
  values: [
    {
      name: 'shows the host, port, path and formatted mount options of the share',
      copied: ['192.168.100.225', '2049', '/media/nfs', 'vers=3, soft'],
      url: createNfsUrl(),
      options: 'vers=3, soft ,',
      rows: {
        [t('host')]: '192.168.100.225',
        [t('port')]: '2049',
        [t('path-on-share')]: '/media/nfs',
        [t('custom-options')]: 'vers=3, soft',
      },
      all: true,
    },
    {
      name: 'leaves the port empty when the url has none',
      copied: ['192.168.100.225', '/media/nfs'],
      url: createNfsUrl({ port: undefined }),
      rows: { [t('port')]: '' },
    },
    {
      name: 'leaves the mount options empty when there are none',
      copied: ['192.168.100.225', '2049', '/media/nfs'],
      url: createNfsUrl(),
      rows: { [t('custom-options')]: '' },
    },
  ],
  secrets: [],
}

const SMB_VALUES: BrUrlCardCase<ReturnType<typeof createSmbUrl>>['values'] = [
  {
    name: 'shows the UNC share path, credentials, domain and formatted mount options',
    copied: ['\\\\192.168.100.10\\share\\backups', 'admin', 'WORKGROUP', 'vers=3.0, soft'],
    url: createSmbUrl(),
    options: 'vers=3.0, ,soft',
    rows: {
      [t('path-on-share')]: '\\\\192.168.100.10\\share\\backups',
      [t('username')]: 'admin',
      [t('password')]: MASKED_SECRET,
      [t('domain')]: 'WORKGROUP',
      [t('custom-options')]: 'vers=3.0, soft',
    },
    all: true,
  },
  {
    name: 'shows only the host as share path when the url has no sub-folder',
    url: createSmbUrl({ path: '' }),
    rows: { [t('path-on-share')]: '\\\\192.168.100.10' },
  },
  {
    name: 'leaves the mount options empty when there are none',
    copied: ['\\\\192.168.100.10\\share\\backups', 'admin', 'WORKGROUP'],
    url: createSmbUrl(),
    rows: { [t('custom-options')]: '' },
  },
]

export const BR_SMB_URL: BrUrlCardCase<ReturnType<typeof createSmbUrl>> = {
  urlProp: 'smb',
  createUrl: createSmbUrl,
  titles: [{ name: 'renders the card title', url: createSmbUrl(), title: t('smb') }],
  values: SMB_VALUES,
  secrets: [{ name: 'never shows the password', url: createSmbUrl({ password: 'p4ssw0rd' }), secret: 'p4ssw0rd' }],
}

// The side panel card masks the password even when there is none (BackupRepositorySmbCard.vue), unlike the detail
// card: reported, to be aligned in the component before the panel shares this row
export const BR_SMB_DETAIL_URL: BrUrlCardCase<ReturnType<typeof createSmbUrl>> = {
  ...BR_SMB_URL,
  values: [
    ...SMB_VALUES,
    {
      name: 'leaves the password empty when the url has no password',
      url: createSmbUrl({ password: '' }),
      rows: { [t('password')]: '' },
    },
  ],
}

export const BR_LOCAL_URL: BrUrlCardCase<ReturnType<typeof createFileUrl>> = {
  urlProp: 'file',
  createUrl: createFileUrl,
  titles: [{ name: 'renders the card title', url: createFileUrl(), title: t('local') }],
  values: [
    {
      name: 'shows the path of the repository',
      copied: ['/mnt/backups'],
      url: createFileUrl({ path: '/mnt/backups' }),
      rows: { [t('path')]: '/mnt/backups' },
      all: true,
    },
  ],
  secrets: [],
}

export const BR_S3_URL: BrUrlCardCase<ReturnType<typeof createS3Url>> = {
  urlProp: 's3',
  createUrl: createS3Url,
  titles: [{ name: 'renders the card title', url: createS3Url(), title: t('s3') }],
  values: [
    {
      name: 'shows the endpoint, security settings, credentials, bucket and path in bucket',
      copied: ['s3.us-west-1.amazonaws.com', 'us-west-1', 'AKIAIOSFODNN7', 'my-bucket', '/backups/xo'],
      url: createS3Url(),
      rows: {
        [t('endpoint-url')]: 's3.us-west-1.amazonaws.com',
        [t('https')]: t('enabled'),
        [t('accept-self-signed-certificates')]: t('disabled'),
        [t('region')]: 'us-west-1',
        [t('access-key-id')]: 'AKIAIOSFODNN7',
        [t('secret')]: MASKED_SECRET,
        [t('bucket-name')]: 'my-bucket',
        [t('path-in-bucket')]: '/backups/xo',
      },
      all: true,
    },
    {
      name: 'shows https as disabled for an http endpoint',
      url: createS3Url({ protocol: 'http' }),
      rows: { [t('https')]: t('disabled') },
    },
    {
      name: 'shows self-signed certificates as accepted when the url allows them',
      url: createS3Url({ allowUnauthorized: true }),
      rows: { [t('accept-self-signed-certificates')]: t('enabled') },
    },
    {
      name: 'shows / as path in bucket when the path is only the bucket',
      url: createS3Url({ path: '/my-bucket' }),
      rows: { [t('bucket-name')]: 'my-bucket', [t('path-in-bucket')]: '/' },
    },
    {
      name: 'leaves the region empty when the url has none',
      copied: ['s3.us-west-1.amazonaws.com', 'AKIAIOSFODNN7', 'my-bucket', '/backups/xo'],
      url: createS3Url({ region: undefined }),
      rows: { [t('region')]: '' },
    },
  ],
  secrets: [
    { name: 'never shows the secret', url: createS3Url({ password: 'wJalrXUtnFEMI' }), secret: 'wJalrXUtnFEMI' },
  ],
}

export const BR_AZURE_URL: BrUrlCardCase<ReturnType<typeof createAzureUrl>> = {
  urlProp: 'azure',
  createUrl: createAzureUrl,
  titles: [
    { name: 'renders the azure card title', url: createAzureUrl(), title: t('azure') },
    { name: 'renders the azurite card title', url: createAzuriteUrl(), title: t('azurite') },
  ],
  values: [
    {
      name: 'shows the host, account, container and path in container of azure, without the https row',
      copied: ['myaccount.blob.core.windows.net', 'myaccount', 'my-container', '/backups/xo'],
      url: createAzureUrl(),
      rows: {
        [t('host')]: 'myaccount.blob.core.windows.net',
        [t('account-name')]: 'myaccount',
        [t('key')]: MASKED_SECRET,
        [t('container-name')]: 'my-container',
        [t('path')]: '/backups/xo',
      },
      all: true,
    },
    {
      name: 'shows the host, https, account, container and path in container of azurite',
      url: createAzuriteUrl(),
      rows: {
        [t('host')]: '127.0.0.1',
        [t('https')]: t('enabled'),
        [t('account-name')]: 'devstoreaccount1',
        [t('key')]: MASKED_SECRET,
        [t('container-name')]: 'my-container',
        [t('path')]: '/backups/xo',
      },
      all: true,
    },
    {
      name: 'shows https as disabled for an http azurite endpoint',
      url: createAzuriteUrl({ protocol: 'http' }),
      rows: { [t('https')]: t('disabled') },
    },
    {
      name: 'shows / as path in container when the path is only the container',
      url: createAzureUrl({ path: '/my-container' }),
      rows: { [t('container-name')]: 'my-container', [t('path')]: '/' },
    },
  ],
  secrets: [
    {
      name: 'never shows the azure account key',
      url: createAzureUrl({ password: 'azure-account-key' }),
      secret: 'azure-account-key',
    },
    {
      name: 'never shows the azurite account key',
      url: createAzuriteUrl({ password: 'azurite-account-key' }),
      secret: 'azurite-account-key',
    },
  ],
}
