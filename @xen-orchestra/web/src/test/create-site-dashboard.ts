import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { ONE_GB, ONE_TB } from '@/shared/constants.ts'
import { createBackupIssue } from '@/test/create-backup-issue.ts'

/**
 * Builds a fully-populated `XoDashboard` for use in tests, with every section
 * on its non-degenerate arm. Pass `overrides` to tweak only the section
 * relevant to the case under test — `{ backups: { error: true } }` to take an
 * error arm, `{ vmsStatus: undefined }` to leave a section still loading.
 *
 * Every count differs from its siblings, so a value landing under the wrong
 * label fails the assertion instead of matching by coincidence.
 */
export function createSiteDashboard(overrides: Partial<XoDashboard> = {}): XoDashboard {
  return {
    nPools: 10,
    nHosts: 20,
    missingPatches: {
      hasAuthorization: true,
      nPools: 10,
      nPoolsWithMissingPatches: 4,
      nHosts: 20,
      nHostsWithMissingPatches: 8,
      nHostsEol: 3,
      nHostsFailed: 1,
    },
    backupRepositories: {
      s3: { size: { backups: 2 * ONE_TB } },
      other: {
        size: { available: 3 * ONE_TB, backups: 4 * ONE_TB, other: 1 * ONE_TB, total: 8 * ONE_TB, used: 5 * ONE_TB },
      },
    },
    storageRepositories: {
      size: { available: 1 * ONE_TB, other: 1 * ONE_TB, replicated: 2 * ONE_TB, total: 4 * ONE_TB, used: 3 * ONE_TB },
    },
    backups: {
      jobs: { disabled: 1, failed: 2, noRecentRun: 3, skipped: 4, successful: 9, total: 19 },
      issues: [createBackupIssue()],
      vmsProtection: { protected: 12, unprotected: 5, notInJob: 6 },
    },
    resourcesOverview: { nCpus: 48, memorySize: 512 * ONE_GB, srSize: 4 * ONE_TB },
    poolsStatus: { connected: 5, disconnected: 3, unreachable: 2, unknown: 1, total: 11 },
    hostsStatus: { running: 6, disabled: 2, halted: 3, unknown: 1, total: 12 },
    vmsStatus: { active: 11, halted: 5, inactive: 7, paused: 4, running: 7, suspended: 2, unknown: 1, total: 18 },
    ...overrides,
  }
}
