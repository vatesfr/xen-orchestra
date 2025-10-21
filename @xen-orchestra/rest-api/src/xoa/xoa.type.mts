import { BACKUP_TYPE } from '@vates/types'
import type { PromiseWriteInStreamError } from '../helpers/helper.type.mjs'

export type DashboardBackupRepositoriesSizeInfo = {
  s3?: {
    size: {
      backups: number
    }
  }
  other?: { size: { available?: number; backups: number; other?: number; total?: number; used?: number } }
}

export type DashboardBackupsInfo = {
  jobs: {
    disabled: number
    failed: number
    skipped: number
    successful: number
    total: number
  }
  issues: {
    logs: ('failure' | 'interrupted' | 'skipped' | 'success')[]
    name?: string
    type: BACKUP_TYPE
    uuid: string
  }[]
  vmsProtection: {
    protected: number
    unprotected: number
    notInJob: number
  }
}

export type XoaDashboard = {
  nPools: number
  nHosts: number
  nHostsEol?: number | PromiseWriteInStreamError
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
  missingPatches:
    | { hasAuthorization: false }
    | {
        hasAuthorization: true
        nHostsWithMissingPatches: number
        nPoolsWithMissingPatches: number
        nHostsFailed: number
      }
  backupRepositories?: DashboardBackupRepositoriesSizeInfo | PromiseWriteInStreamError
  storageRepositories:
    | {
        size: {
          available: number
          other: number
          replicated: number
          total: number
          used: number
        }
      }
    | PromiseWriteInStreamError
  backups?: DashboardBackupsInfo | PromiseWriteInStreamError

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

export type PingResponse = {
  result: string
  timestamp: number
}
