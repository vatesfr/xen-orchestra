import {
  buildAzureBackupRepositoryDetailsPayload,
  buildBackupRepositoryDetailsPayload,
  buildLocalBackupRepositoryDetailsPayload,
  buildNfsBackupRepositoryDetailsPayload,
  buildS3BackupRepositoryDetailsPayload,
  buildSmbBackupRepositoryDetailsPayload,
  NFS_DEFAULT_PORT,
  SMB_DEFAULT_DOMAIN,
} from '@/modules/backup-repository/utils/xo-backup-repository-details-payload.util.ts'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const NFS_FORM_DATA = { host: '192.168.1.10', port: '2050', path: '/exports/backups', customOptions: 'vers=4' }

const SMB_FORM_DATA = {
  pathOnShare: '192.168.1.10\\share',
  subfolder: 'backups',
  domain: 'CORP',
  username: 'admin',
  password: 'secret',
  customOptions: 'vers=3.0',
}

const S3_FORM_DATA = {
  endpoint: 's3.us-east-2.amazonaws.com',
  useHttps: true,
  allowUnauthorized: false,
  region: 'us-east-2',
  accessKeyId: 'AKID',
  secret: 'secret',
  bucket: 'bucket',
  pathInBucket: 'backups',
}

const AZURE_FORM_DATA = {
  hostName: 'account.blob.core.windows.net',
  useHttps: true,
  accountName: 'account',
  key: 'key',
  containerName: 'container',
  pathInContainer: 'backups',
}

describe('buildLocalBackupRepositoryDetailsPayload', () => {
  it('describes a local repository with its path', () => {
    expect(buildLocalBackupRepositoryDetailsPayload({ path: '/var/backups' })).toEqual({
      urlInfo: { type: 'file', path: '/var/backups' },
    })
  })
})

describe('buildNfsBackupRepositoryDetailsPayload', () => {
  it('describes an NFS repository with its port and custom options', () => {
    expect(buildNfsBackupRepositoryDetailsPayload(NFS_FORM_DATA)).toEqual({
      urlInfo: { type: 'nfs', host: '192.168.1.10', port: '2050', path: '/exports/backups' },
      options: 'vers=4',
    })
  })

  it('falls back to the default port, without custom options', () => {
    expect(buildNfsBackupRepositoryDetailsPayload({ ...NFS_FORM_DATA, port: '', customOptions: '' })).toEqual({
      urlInfo: { type: 'nfs', host: '192.168.1.10', port: NFS_DEFAULT_PORT, path: '/exports/backups' },
    })
  })
})

describe('buildSmbBackupRepositoryDetailsPayload', () => {
  it('describes an SMB repository with its credentials and custom options', () => {
    expect(buildSmbBackupRepositoryDetailsPayload(SMB_FORM_DATA)).toEqual({
      urlInfo: {
        type: 'smb',
        host: '192.168.1.10\\share',
        path: 'backups',
        domain: 'CORP',
        username: 'admin',
        password: 'secret',
      },
      options: 'vers=3.0',
    })
  })

  it('falls back to the default domain, without custom options', () => {
    expect(buildSmbBackupRepositoryDetailsPayload({ ...SMB_FORM_DATA, domain: '', customOptions: '' })).toEqual({
      urlInfo: expect.objectContaining({ domain: SMB_DEFAULT_DOMAIN }),
    })
  })
})

describe('buildS3BackupRepositoryDetailsPayload', () => {
  it('describes an S3 repository with its bucket and path in bucket', () => {
    expect(buildS3BackupRepositoryDetailsPayload(S3_FORM_DATA)).toEqual({
      urlInfo: {
        type: 's3',
        protocol: 'https',
        host: 's3.us-east-2.amazonaws.com',
        path: 'bucket/backups',
        region: 'us-east-2',
        username: 'AKID',
        password: 'secret',
      },
    })
  })

  it('allows unauthorized certificates when asked to', () => {
    expect(buildS3BackupRepositoryDetailsPayload({ ...S3_FORM_DATA, allowUnauthorized: true }).urlInfo).toMatchObject({
      allowUnauthorized: true,
    })
  })

  it('uses HTTP when HTTPS is off', () => {
    expect(buildS3BackupRepositoryDetailsPayload({ ...S3_FORM_DATA, useHttps: false }).urlInfo).toMatchObject({
      protocol: 'http',
    })
  })
})

describe('buildAzureBackupRepositoryDetailsPayload', () => {
  it('describes an Azure repository with its container and path in container', () => {
    expect(buildAzureBackupRepositoryDetailsPayload(AZURE_FORM_DATA, 'azure')).toEqual({
      urlInfo: {
        type: 'azure',
        protocol: 'https',
        host: 'account.blob.core.windows.net',
        path: 'container/backups',
        username: 'account',
        password: 'key',
      },
    })
  })

  it('keeps the Azurite type', () => {
    expect(buildAzureBackupRepositoryDetailsPayload(AZURE_FORM_DATA, 'azurite').urlInfo).toMatchObject({
      type: 'azurite',
    })
  })
})

describe('buildBackupRepositoryDetailsPayload', () => {
  it('rebuilds the details of a repository from its url and options', () => {
    expect(
      buildBackupRepositoryDetailsPayload(
        parseBackupRepositoryUrl('nfs://192.168.1.10:2049:/exports/backups'),
        'vers=3',
        {}
      )
    ).toEqual({
      urlInfo: { type: 'nfs', host: '192.168.1.10', port: '2049', path: '/exports/backups' },
      options: 'vers=3',
    })
  })

  it('applies the changes over the details of the repository', () => {
    expect(
      buildBackupRepositoryDetailsPayload(
        parseBackupRepositoryUrl('nfs://192.168.1.10:2049:/exports/backups'),
        'vers=3',
        {
          host: '192.168.1.20',
          customOptions: 'vers=4',
        }
      )
    ).toEqual({
      urlInfo: { type: 'nfs', host: '192.168.1.20', port: '2049', path: '/exports/backups' },
      options: 'vers=4',
    })
  })

  it('rebuilds the details of an Azurite repository with its own type', () => {
    expect(
      buildBackupRepositoryDetailsPayload(
        parseBackupRepositoryUrl('azurite+http://devstoreaccount1:key@127.0.0.1:10000/container'),
        undefined,
        {}
      )?.urlInfo
    ).toMatchObject({ type: 'azurite', protocol: 'http', host: '127.0.0.1:10000' })
  })

  it('returns no details for an unrecognized url', () => {
    expect(
      buildBackupRepositoryDetailsPayload(parseBackupRepositoryUrl('ftp://192.168.1.10/backups'), undefined, {})
    ).toBeUndefined()
  })
})
