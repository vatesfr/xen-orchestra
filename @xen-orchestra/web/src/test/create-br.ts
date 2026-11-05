import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'

/**
 * Builds a fully-populated FrontXoBackupRepository for use in tests. Pass overrides to
 * tweak only the fields relevant to the case under test.
 */
export function createBr(overrides: Partial<FrontXoBackupRepository> = {}): FrontXoBackupRepository {
  return {
    id: 'backup-repository-123' as FrontXoBackupRepository['id'],
    name: 'Test backup repository',
    enabled: true,
    error: undefined,
    url: 'nfs://192.168.100.225:/media/nfs',
    proxy: undefined,
    benchmarks: [],
    options: undefined,
    ...overrides,
  }
}
