import type { EventEmitter } from 'node:events'
import type { Task } from '@vates/types/lib/vates/task'
import type { XapiHostStats, XapiVmStats, XapiStatsGranularity } from '@vates/types/common'
import type {
  XenApiHostWrapped,
  XenApiMessage,
  XenApiNetworkWrapped,
  XenApiPciWrapped,
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
import type { XoHost, XoServer, XoUser, XapiXoRecord, XoVm, XoSchedule, XoJob, XoGroup, XoPool } from '@vates/types/xo'

import type { InsertableXoServer } from '../servers/server.type.mjs'

type XapiRecordByXapiXoRecord = {
  host: XenApiHostWrapped
  message: XenApiMessage
  network: XenApiNetworkWrapped
  PCI: XenApiPciWrapped
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
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  getUser: (id: XoUser['id']) => Promise<XoUser>
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(maybeId: T['id'] | T, type: T['type']) => XapiRecordByXapiXoRecord[T['type']]
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(body: InsertableXoServer): Promise<XoServer>
  rollingPoolReboot(pool: XoPool, opts?: { parentTask?: Task }): Promise<void>
  rollingPoolUpdate(pool: XoPool, opts?: { rebootVm?: boolean; parentTask?: Task }): Promise<void>
  runJob(job: XoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
