import type { EventEmitter } from 'node:events'
import type { Task } from '@vates/types/lib/vates/task'
import type { XapiHostStats, XapiVmStats, XapiStatsGranularity } from '@vates/types/common'
import type {
  XenApiHostWrapped,
  XenApiMessage,
  XenApiNetwork,
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
  XoBackupRepository,
  XoHost,
  XoServer,
  XoUser,
  XapiXoRecord,
  XoVm,
  XoSchedule,
  XoJob,
  XoGroup,
} from '@vates/types/xo'

import type { InsertableXoServer } from '../servers/server.type.mjs'

type XapiRecordByXapiXoRecord = {
  host: XenApiHostWrapped
  message: XenApiMessage
  network: XenApiNetwork
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
  getAllGroups(): Promise<XoGroup[]>
  getAllRemotes(): Promise<XoBackupRepository[]>
  getAllRemotesInfo(): Promise<
    Record<
      XoBackupRepository['id'],
      {
        size: number
        used: number
        available: number
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
  getGroup(id: XoGroup['id']): Promise<XoGroup>
  getJob(id: XoJob['id']): Promise<XoJob>
  getObject: <T extends XapiXoRecord>(id: T['id'], type?: T['type']) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) => Record<T['id'], T>
  getTotalBackupSizeOnRemote(id: XoBackupRepository['id']): Promise<{ onDisk: number }>
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  getUser: (id: XoUser['id']) => Promise<XoUser>
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) => XapiRecordByXapiXoRecord[T['type']]
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(body: InsertableXoServer): Promise<XoServer>
  runJob(job: XoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
