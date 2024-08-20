export type XoDashboard = {
  nPools: number
  nHosts: number
  missingPatches: {
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
}
