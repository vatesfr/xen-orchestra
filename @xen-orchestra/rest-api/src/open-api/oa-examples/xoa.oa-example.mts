export const xoaDashboard = {
  nPools: 2,
  nHosts: 5,
  backupRepositories: {
    s3: {
      size: {
        backups: 286295393792,
      },
    },
    other: {
      size: {
        available: 62630354944,
        backups: 20684251648,
        other: 66875031040,
        total: 150189637632,
        used: 87559282688,
      },
    },
  },
  resourcesOverview: {
    nCpus: 52,
    memorySize: 107374182400,
    srSize: 751123595264,
  },
  poolsStatus: {
    connected: 2,
    unreachable: 7,
    unknown: 0,
  },
  nHostsEol: 0,
  missingPatches: {
    hasAuthorization: true,
    nHostsFailed: 1,
    nHostsWithMissingPatches: 4,
    nPoolsWithMissingPatches: 2,
  },
  storageRepositories: {
    size: {
      available: 628454834176,
      other: 122641256960,
      replicated: 27504128,
      total: 751123595264,
      used: 122668761088,
    },
  },
  backups: {
    jobs: {
      disabled: 8,
      failed: 0,
      skipped: 0,
      successful: 0,
      total: 8,
    },
    issues: [],
    vmsProtection: {
      protected: 0,
      unprotected: 0,
      notInJob: 20,
    },
  },
}
