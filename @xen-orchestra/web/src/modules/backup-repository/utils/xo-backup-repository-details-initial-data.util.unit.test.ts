import { getBackupRepositoryDetailsInitialData } from '@/modules/backup-repository/utils/xo-backup-repository-details-initial-data.util.ts'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

describe('getBackupRepositoryDetailsInitialData', () => {
  it('fills the path of a local repository', () => {
    expect(getBackupRepositoryDetailsInitialData(parseBackupRepositoryUrl('file:///var/backups'), undefined)).toEqual({
      file: { path: '/var/backups' },
    })
  })

  it('fills the NFS details, with the mount options as custom options', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl('nfs://192.168.1.10:2049:/exports/backups'),
        'vers=3'
      )
    ).toEqual({
      nfs: { host: '192.168.1.10', port: '2049', path: '/exports/backups', customOptions: 'vers=3' },
    })
  })

  it('leaves the NFS port and custom options empty when the repository has none', () => {
    expect(
      getBackupRepositoryDetailsInitialData(parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups'), undefined)
    ).toMatchObject({
      nfs: { port: '', customOptions: '' },
    })
  })

  it('fills the SMB details', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl('smb://admin:secret@CORP\\\\192.168.1.10\\share\0backups\\xo'),
        'vers=3.0'
      )
    ).toEqual({
      smb: {
        pathOnShare: '192.168.1.10\\share',
        subfolder: 'backups\\xo',
        domain: 'CORP',
        username: 'admin',
        password: 'secret',
        customOptions: 'vers=3.0',
      },
    })
  })

  it('splits the S3 path into the bucket and the path in bucket, without leading slash', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl(
          's3://AKID:secret@s3.us-east-2.amazonaws.com/bucket/backups/xo?allowUnauthorized=true#us-east-2'
        ),
        undefined
      )
    ).toEqual({
      s3: {
        endpoint: 's3.us-east-2.amazonaws.com',
        useHttps: true,
        allowUnauthorized: true,
        region: 'us-east-2',
        accessKeyId: 'AKID',
        secret: 'secret',
        bucket: 'bucket',
        pathInBucket: 'backups/xo',
      },
    })
  })

  it('leaves the path in bucket and the region empty for a repository at the root of a bucket, without region', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl('s3+http://AKID:secret@minio.local:9000/bucket'),
        undefined
      )
    ).toMatchObject({
      s3: { useHttps: false, allowUnauthorized: false, region: '', bucket: 'bucket', pathInBucket: '' },
    })
  })

  it('splits the Azure path into the container and the path in container', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl('azure://account:key@account.blob.core.windows.net/container/backups'),
        undefined
      )
    ).toEqual({
      azure: {
        hostName: 'account.blob.core.windows.net',
        useHttps: true,
        accountName: 'account',
        key: 'key',
        containerName: 'container',
        pathInContainer: 'backups',
      },
    })
  })

  it('fills the Azure details of an Azurite repository, keeping the port in the host name', () => {
    expect(
      getBackupRepositoryDetailsInitialData(
        parseBackupRepositoryUrl('azurite+http://devstoreaccount1:key@127.0.0.1:10000/container'),
        undefined
      )
    ).toEqual({
      azure: {
        hostName: '127.0.0.1:10000',
        useHttps: false,
        accountName: 'devstoreaccount1',
        key: 'key',
        containerName: 'container',
        pathInContainer: '',
      },
    })
  })

  it('returns no details for an unrecognized url', () => {
    expect(
      getBackupRepositoryDetailsInitialData(parseBackupRepositoryUrl('ftp://192.168.1.10/backups'), undefined)
    ).toEqual({})
  })
})
