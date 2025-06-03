import type { EventEmitter } from 'node:events'
import type { Task } from '@vates/types/lib/vates/task'
import type { Xapi } from '@vates/types/lib/xen-orchestra/xapi'
import type { XapiHostStats, XapiVmStats, XapiStatsGranularity, BACKUP_TYPE } from '@vates/types/common'
import type {
  XenApiHostWrapped,
  XenApiMessage,
  XenApiNetworkWrapped,
  XenApiPifWrapped,
  XenApiPoolWrapped,
  XenApiSrWrapped,
  XenApiVbdWrapped,
  XenApiVdiWrapped,
  XenApiVgpuWrapped,
  XenApiVifWrapped,
  XenApiVmWrapped,
  XenApiVtpmWrapped,
} from '@vates/types/xen-api'
import type {
  AnyXoJob,
  XoBackupRepository,
  XoHost,
  XoServer,
  XoUser,
  XapiXoRecord,
  XoVm,
  XoSchedule,
  XoJob,
  XoGroup,
  XoPool
} from '@vates/types/xo'

import type { InsertableXoServer } from '../servers/server.type.mjs'

type XapiRecordByXapiXoRecord = {
  host: XenApiHostWrapped
  message: XenApiMessage
  network: XenApiNetworkWrapped
  PIF: XenApiPifWrapped
  pool: XenApiPoolWrapped
  SR: XenApiSrWrapped
  VBD: XenApiVbdWrapped
  VDI: XenApiVdiWrapped
  'VDI-snapshot': XenApiVdiWrapped
  'VDI-unmanaged': XenApiVdiWrapped
  VGPU: XenApiVgpuWrapped
  VIF: XenApiVifWrapped
  VM: XenApiVmWrapped
  'VM-controller': XenApiVmWrapped
  'VM-snapshot': XenApiVmWrapped
  'VM-template': XenApiVmWrapped
  VTPM: XenApiVtpmWrapped
}

export type XoApp = {
  config: {
    getOptionalDuration(path: string): number | undefined
  }
  tasks: EventEmitter & {
    create: (params: { name: string; objectId?: string; type?: string }) => Task
  }

  // methods ------------
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  /* Throw if no authorization */
  checkFeatureAuthorization(featureCode: string): Promise<void>
  /* connect a server (XCP-ng/XenServer) */
  connectXenServer(id: XoServer['id']): Promise<void>
  /* disconnect a server (XCP-ng/XenServer) */
  disconnectXenServer(id: XoServer['id']): Promise<void>
  getAllGroups(): Promise<XoGroup[]>
  getAllJobs(type?: BACKUP_TYPE): Promise<AnyXoJob[]>
  getAllRemotes(): Promise<XoBackupRepository[]>
  getAllRemotesInfo(): Promise<
    Record<
      XoBackupRepository['id'],
      {
        size?: number
        used: number
        available?: number
        encryption: {
          algorithm: string
          isLegacy: boolean
          recommanded: string
        }
      }
    >
  >
  getAllSchedules(): Promise<XoSchedule[]>
  getAllUsers(): Promise<XoUser[]>
  getAllXenServers(): Promise<XoServer[]>
  // @TODO: Correctly type this methods and XoLogs when migrate the endpoint "backup/logs"
  getBackupNgLogsSorted(opts: { filter: (log: Record<string, string>) => boolean }): Promise<Record<string, string>[]>
  getGroup(id: XoGroup['id']): Promise<XoGroup>
  getHVSupportedVersions: undefined | (() => Promise<{ [key: XoHost['productBrand']]: string }>)
  getJob(id: XoJob['id']): Promise<XoJob>
  getObject: <T extends XapiXoRecord>(id: T['id'], type?: T['type']) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) => Record<T['id'], T>
  getTotalBackupSizeOnRemote(id: XoBackupRepository['id']): Promise<{ onDisk: number }>
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  getUser: (id: XoUser['id']) => Promise<XoUser>
  getXapi(maybeId: XapiXoRecord['id'] | XapiXoRecord): Xapi
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) => XapiRecordByXapiXoRecord[T['type']]
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  hasFeatureAuthorization(featureCode: string): Promise<boolean>
  hasObject<T extends XapiXoRecord>(id: T['id'], type: T['type']): boolean
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(body: InsertableXoServer): Promise<XoServer>
  rollingPoolReboot(pool: XoPool, opts?: { parentTask?: Task }): Promise<void>
  rollingPoolUpdate(pool: XoPool, opts?: { rebootVm?: boolean; parentTask?: Task }): Promise<void>
  runJob(job: XoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
