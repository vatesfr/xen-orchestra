export type BackupIssue = {
  logs: ('failure' | 'interrupted' | 'skipped' | 'success')[]
  name?: string
  type: 'backup' | 'metadataBackup' | 'mirrorBackup'
  uuid: string
}

export type XoDashboard = {
  nPools?: number
  nHosts?: number
  missingPatches?:
    | {
        hasAuthorization: true
        nHosts: number
        nHostsEol: number | { isEmpty: true }
        nHostsWithMissingPatches: number
        nPoolsWithMissingPatches: number
        nHostsFailed: number
        nPools: number
      }
    | { hasAuthorization: false }
    | { error: true }
  backupRepositories?:
    | ({
        s3?: {
          size: {
            backups: number
          }
        }
        other?: {
          size: {
            available?: number
            backups: number
            other?: number
            total?: number
            used?: number
          }
        }
      } & { isExpired?: true })
    | ({ isEmpty: true } & { isExpired?: true })
    | { error: true }
  storageRepositories?:
    | {
        size: {
          available: number
          other: number
          replicated: number
          total: number
          used: number
        }
      }
    | { error: true }
    | { isEmpty: true }
  backups?:
    | ({
        jobs: {
          disabled: number
          failed: number
          noRecentRun: number
          skipped: number
          successful: number
          total: number
        }
        issues: BackupIssue[]
        vmsProtection: {
          protected: number
          unprotected: number
          notInJob: number
        }
      } & { isExpired?: true })
    | ({ isEmpty: true } & { isExpired?: true })
    | { error: true }
  resourcesOverview?:
    | {
        nCpus: number
        memorySize: number
        srSize: number
      }
    | { isEmpty: true }
  poolsStatus?: {
    connected: number
    disconnected: number
    unreachable: number
    unknown: number
    total: number
  }
  hostsStatus?: {
    disabled: number
    running: number
    halted: number
    unknown: number
    total: number
  }
  vmsStatus?: {
    active: number
    halted: number
    inactive: number
    paused: number
    running: number
    suspended: number
    unknown: number
    total: number
  }
}
