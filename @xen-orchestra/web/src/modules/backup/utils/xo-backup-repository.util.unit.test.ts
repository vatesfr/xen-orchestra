import {
  formatMountOptions,
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
  splitBackupRepositoryPath,
} from '@/modules/backup/utils/xo-backup-repository.util.ts'
import { createBr } from '@/test/create-br.ts'
import { objectIcon } from '@core/icons'

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
