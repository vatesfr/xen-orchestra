export type XoDashboard = {
  nPools: number
  nHosts: number
  nHostsEol?: number
  missingPatches?: {
    nHostsWithMissingPatches: number
    nPoolsWithMissingPatches: number
  }
  backupRepositories?: {
    size: {
      available: number
      backups: number
      other: number
      total: number
      used: number
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
  }
}
