export type BackupIssue = {
  logs: ('failure' | 'interrupted' | 'skipped' | 'success')[]
  name?: string
  type: 'backup' | 'metadataBackup' | 'mirrorBackup'
  uuid: string
}

export type XoDashboard = {
  nPools: number
  nHosts: number
  nHostsEol?: number
  missingPatches:
    | { hasAuthorization: false }
    | {
        hasAuthorization: true
        nHostsWithMissingPatches: number
        nPoolsWithMissingPatches: number
        nHostsFailed: number
      }
  backupRepositories?: {
    s3: {
      size: {
        backups: number
      }
    }
    other: {
      size: {
        available: number
        backups: number
        other: number
        total: number
        used: number
      }
    }
  }
  storageRepositories: {
    size: {
      available: number
      other: number
      replicated: number
      total: number
      used: number
    }
  }
  backups?: {
    jobs: {
      disabled: number
      failed: number
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
  }
  resourcesOverview: {
    nCpus: number
    memorySize: number
    srSize: number
  }
  poolsStatus: {
    connected: number
    unreachable: number
    unknown: number
  }
  hostsStatus: {
    running: number
    halted: number
    unknown: number
    total: number
  }
  vmsStatus: {
    active: number
    inactive: number
    unknown: number
    total: number
  }
}
