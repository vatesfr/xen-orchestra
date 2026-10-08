import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import {
  formatMountOptions,
  getBackupJobsUsingBackupRepository,
  getBackupRepositoryDetailsInitialData,
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
  MASKED_SECRET,
  maskSecret,
  splitBackupRepositoryPath,
} from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { createBr } from '@/test/create-br.ts'
import { objectIcon } from '@core/icons'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

describe('getBackupRepositoryStatus', () => {
  it('reports a disabled repository as disabled', () => {
    expect(getBackupRepositoryStatus(createBr({ enabled: false }))).toBe('disabled')
  })

  it('reports a disabled repository as disabled even when it has an error', () => {
    const br = createBr({ enabled: false, error: { code: 'ENOENT' } })

    expect(getBackupRepositoryStatus(br)).toBe('disabled')
  })

  it('reports an enabled repository with an error as unable to connect', () => {
    const br = createBr({ error: { code: 'ENOENT' } })

    expect(getBackupRepositoryStatus(br)).toBe('unable-to-connect')
  })

  it('reports an enabled repository without error as enabled', () => {
    expect(getBackupRepositoryStatus(createBr())).toBe('enabled')
  })
})

describe('getBackupRepositoryIcon', () => {
  it('reports an unknown type as unknown, even when the repository looks healthy', () => {
    expect(getBackupRepositoryIcon(createBr(), undefined)).toBe(objectIcon('br', 'unknown'))
  })

  it('reports a disabled repository as disabled', () => {
    expect(getBackupRepositoryIcon(createBr({ enabled: false }), 'nfs')).toBe(objectIcon('br', 'disabled'))
  })

  it('reports an enabled repository with an error as disconnected', () => {
    const br = createBr({ error: { code: 'ENOENT' } })

    expect(getBackupRepositoryIcon(br, 'nfs')).toBe(objectIcon('br', 'disconnected'))
  })

  it('reports an enabled repository without error as connected', () => {
    expect(getBackupRepositoryIcon(createBr(), 'nfs')).toBe(objectIcon('br', 'connected'))
  })
})

describe('getBackupJobsUsingBackupRepository', () => {
  // createBr() has the id backup-repository-123
  const br = createBr()

  function createBackupJob(overrides: Record<string, unknown>) {
    return { id: 'backup-job-1', name: 'Backup job', type: 'backup', ...overrides } as unknown as FrontAnyXoBackupJob
  }

  it('finds the jobs targeting the repository', () => {
    const singleTarget = createBackupJob({ id: 'single', remotes: { id: 'backup-repository-123' } })
    const multipleTargets = createBackupJob({
      id: 'multiple',
      remotes: { id: { __or: ['backup-repository-456', 'backup-repository-123'] } },
    })

    expect(getBackupJobsUsingBackupRepository(br, [singleTarget, multipleTargets])).toEqual([
      singleTarget,
      multipleTargets,
    ])
  })

  it('finds the mirror jobs using the repository as source', () => {
    const mirrorJob = createBackupJob({
      type: 'mirrorBackup',
      sourceRemote: 'backup-repository-123',
      remotes: { id: 'backup-repository-456' },
    })

    expect(getBackupJobsUsingBackupRepository(br, [mirrorJob])).toEqual([mirrorJob])
  })

  it('ignores the jobs using other repositories only', () => {
    const otherTarget = createBackupJob({ remotes: { id: 'backup-repository-456' } })
    const otherSource = createBackupJob({
      type: 'mirrorBackup',
      sourceRemote: 'backup-repository-789',
      remotes: { id: 'backup-repository-456' },
    })

    expect(getBackupJobsUsingBackupRepository(br, [otherTarget, otherSource])).toEqual([])
  })
})

describe('formatMountOptions', () => {
  it('returns an empty string when there are no options', () => {
    expect(formatMountOptions(undefined)).toBe('')
  })

  it('trims each option and drops the empty ones', () => {
    expect(formatMountOptions('vers=3.0, ,soft,')).toBe('vers=3.0, soft')
  })
})

describe('splitBackupRepositoryPath', () => {
  it('splits the root from the sub path', () => {
    expect(splitBackupRepositoryPath('/bucket/backups/xo')).toEqual({ root: 'bucket', subPath: '/backups/xo' })
  })

  it('ignores leading slashes', () => {
    expect(splitBackupRepositoryPath('//bucket/backups')).toEqual({ root: 'bucket', subPath: '/backups' })
    expect(splitBackupRepositoryPath('bucket/backups')).toEqual({ root: 'bucket', subPath: '/backups' })
  })

  it('returns / as sub path when there is only a root', () => {
    expect(splitBackupRepositoryPath('/bucket')).toEqual({ root: 'bucket', subPath: '/' })
  })

  it('returns an empty root when the path is empty', () => {
    expect(splitBackupRepositoryPath('')).toEqual({ root: '', subPath: '/' })
  })
})

describe('maskSecret', () => {
  it('masks a given secret', () => {
    expect(maskSecret('password')).toBe(MASKED_SECRET)
  })

  it('leaves a missing secret empty', () => {
    expect({ empty: maskSecret(''), undefined: maskSecret(undefined) }).toEqual({ empty: '', undefined: '' })
  })
})

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
