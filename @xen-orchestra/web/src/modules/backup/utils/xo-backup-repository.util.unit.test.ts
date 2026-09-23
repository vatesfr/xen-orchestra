import {
  formatMountOptions,
  getBackupRepositoryIcon,
  getBackupRepositoryStatus,
  getBackupRepositoryTypeLabelKey,
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

describe('getBackupRepositoryTypeLabelKey', () => {
  it('labels a file repository as local', () => {
    expect(getBackupRepositoryTypeLabelKey('file')).toBe('local')
  })

  it('labels a repository after its own type', () => {
    expect(getBackupRepositoryTypeLabelKey('nfs')).toBe('nfs')
    expect(getBackupRepositoryTypeLabelKey('s3')).toBe('s3')
    expect(getBackupRepositoryTypeLabelKey('azurite')).toBe('azurite')
  })

  it('falls back to unknown when the type could not be parsed', () => {
    expect(getBackupRepositoryTypeLabelKey(undefined)).toBe('unknown')
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
