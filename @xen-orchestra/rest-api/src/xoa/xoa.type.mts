import { BACKUP_TYPE } from '@vates/types'
import type { IsEmptyData, IsMaybeExpired, PromiseWriteInStreamError } from '../helpers/helper.type.mjs'
import type { HasNoAuthorization } from '../rest-api/rest-api.type.mjs'

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
    noRecentRun: number
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

export type SrSizeInfo = {
  size: {
    available: number
    other: number
    replicated: number
    total: number
    used: number
  }
}

export type MissingPatchesInfo = {
  hasAuthorization: true
  nHosts: number
  nHostsEol: number | IsEmptyData
  nHostsWithMissingPatches: number
  nHostsFailed: number
  nPools: number
  nPoolsWithMissingPatches: number
}

export type XoaDashboard = {
  nPools: number
  nHosts: number
  hostsStatus: {
    disabled: number
    running: number
    halted: number
    unknown: number
    total: number
  }
  vmsStatus: {
    active: number
    halted: number
    inactive: number
    paused: number
    running: number
    suspended: number
    unknown: number
    total: number
  }
  missingPatches: MissingPatchesInfo | HasNoAuthorization | PromiseWriteInStreamError
  backupRepositories?:
    | IsMaybeExpired<DashboardBackupRepositoriesSizeInfo>
    | IsMaybeExpired<IsEmptyData>
    | PromiseWriteInStreamError
  storageRepositories: SrSizeInfo | PromiseWriteInStreamError | IsEmptyData

  backups?: IsMaybeExpired<DashboardBackupsInfo> | IsMaybeExpired<IsEmptyData> | PromiseWriteInStreamError
  resourcesOverview:
    | {
        nCpus: number
        memorySize: number
        srSize: number
      }
    | IsEmptyData
  poolsStatus: {
    connected: number
    disconnected: number
    unreachable: number
    unknown: number
    total: number
  }
}

export type PingResponse = {
  result: 'pong'
  timestamp: number
}

export type XoGuiRoutes = {
  xo5?: string
  xo6?: string
}
