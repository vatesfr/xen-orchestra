import type { BackupIssue } from '@/modules/site/types/xo-dashboard.type.ts'

/**
 * Builds a fully-populated `BackupIssue` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createBackupIssue(overrides: Partial<BackupIssue> = {}): BackupIssue {
  return {
    uuid: 'backup-job-123',
    name: 'Nightly backup',
    type: 'backup',
    logs: ['success', 'failure', 'skipped'],
    ...overrides,
  }
}
