export type XoaDashboard = {
  nPools: number
  nHosts: number
  nHostsEol?: number
  missingPatches?: {
    nHostsWithMissingPatches: number
    nPoolsWithMissingPatches: number
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
    issues: {
      logs: ('failure' | 'interrupted' | 'skipped' | 'success')[]
      name: string
      type: 'backup' | 'metadataBackup' | 'mirrorBackup'
      uuid: string
    }[]
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
}
