import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import {
  formatMountOptions,
  formatSmbPathOnShare,
  getBackupJobsUsingBackupRepository,
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
  isBackupRepositoryEncrypted,
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

describe('formatSmbPathOnShare', () => {
  it('builds the UNC path from the host and the subfolder', () => {
    expect(formatSmbPathOnShare('192.168.100.10\\share', 'backups')).toBe('\\\\192.168.100.10\\share\\backups')
  })

  it('does not add a trailing separator when there is no subfolder', () => {
    expect(formatSmbPathOnShare('192.168.100.10\\share', '')).toBe('\\\\192.168.100.10\\share')
  })
})

describe('isBackupRepositoryEncrypted', () => {
  it('is true when the url holds an encryption key', () => {
    expect(
      isBackupRepositoryEncrypted(
        parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups?useVhdDirectory=true&encryptionKey=%22key%22')
      )
    ).toBe(true)
  })

  it('is false when the url holds no encryption key', () => {
    expect(isBackupRepositoryEncrypted(parseBackupRepositoryUrl('nfs://192.168.1.10:/exports/backups'))).toBe(false)
  })

  it('is false while the url is not parsed', () => {
    expect(isBackupRepositoryEncrypted(undefined)).toBe(false)
  })
})
