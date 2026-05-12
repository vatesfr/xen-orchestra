import type { XoAlarm, XoHost, XoSr, XoUser, XoVm, XoVmBackupArchive, XoVmBackupJob } from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'

/**
 * Body of `PATCH /vms/{id}`.
 *
 * Field naming mirrors the JSON-RPC `vm.set` method so that existing clients
 * (xo-web, scripts) can switch transports without renaming fields. The
 * underlying `_editVm` accepts both camelCase and snake_case aliases.
 */
export interface UpdateVmRequestBody {
  affinityHost?: string | null
  auto_poweron?: boolean
  blockedOperations?: Record<string, boolean | string | null>
  coresPerSocket?: number | string | null
  cpuCap?: number | null
  cpuMask?: number[]
  /** Admin-only — host-wide scheduler weight. */
  cpuWeight?: number | null
  CPUs?: number
  cpusMax?: number | string
  /**
   * Update VM creation metadata stored under `other_config.xo:*`. The object is
   * merged with the existing data.
   */
  creation?: { user?: string }
  expNestedHvm?: boolean
  hasVendorDevice?: boolean
  high_availability?: 'best-effort' | 'restart' | ''
  hvmBootFirmware?: string | null
  memory?: number | string
  memoryMax?: number | string
  memoryMin?: number | string
  memoryStaticMax?: number | string
  name_description?: string
  name_label?: string
  nestedVirt?: boolean
  nicType?: string | null
  notes?: string | null
  PV_args?: string
  /** Admin-only — moves the VM in/out of a resource set. */
  resourceSet?: string | null
  secureBoot?: boolean
  /**
   * When `true` and the VM is in a resource set, share the VM with all members
   * of that resource set. `false` is a no-op (matches JSON-RPC `vm.set`).
   */
  share?: boolean
  startDelay?: number
  suspendSr?: string | null
  tags?: string[]
  uefiMode?: 'setup' | 'user'
  vga?: 'std' | 'cirrus'
  videoram?: 1 | 2 | 4 | 8 | 16
  viridian?: boolean
  virtualizationMode?: 'pv' | 'hvm'
  xenStoreData?: Record<string, string | null>
}

type VmDashboardRun = { backupJobId: XoVmBackupJob['id']; timestamp: number; status: string }
type VmDashboardBackupArchive = {
  id: XoVmBackupArchive['id']
  timestamp: XoVmBackupArchive['timestamp']
  backupRepository: XoVmBackupArchive['backupRepository']
  size: XoVmBackupArchive['size']
}

export type VmDashboard = {
  quickInfo: Pick<
    XoVm,
    | 'id'
    | 'power_state'
    | 'uuid'
    | 'name_description'
    | 'mainIpAddress'
    | '$pool'
    | 'virtualizationMode'
    | 'tags'
    | 'startTime'
    | 'pvDriversVersion'
    | 'pvDriversUpToDate'
  > & {
    CPUs: {
      number: number
    }
    os_version: {
      name?: string
    }
    memory: {
      size: number
    }
    creation: {
      date?: string
      user?: XoUser['id']
    }
    host?: XoHost['id']
    pvDriversDetected: boolean
  }
  alarms: XoAlarm['id'][]
  backupsInfo: {
    lastRuns: VmDashboardRun[]
    vmProtection: 'protected' | 'unprotected' | 'not-in-active-job'
    replication: { id: XoVm['id']; timestamp: number; sr?: XoSr['id'] } | {}
    backupArchives: VmDashboardBackupArchive[]
  }
}

export type UnbrandedVmDashboard = {
  quickInfo: Omit<Unbrand<VmDashboard['quickInfo']>, 'creation'> & {
    creation: Unbrand<VmDashboard['quickInfo']['creation']>
  }
  alarms: Unbrand<XoAlarm>['id'][]
  backupsInfo: {
    lastRuns: Unbrand<VmDashboardRun>[]
    vmProtection: VmDashboard['backupsInfo']['vmProtection']
    replication: Unbrand<VmDashboard['backupsInfo']['replication']>
    backupArchives: Unbrand<VmDashboardBackupArchive>[]
  }
}
