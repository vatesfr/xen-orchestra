import type { EventEmitter } from 'node:events'
import type { VatesTask } from '@vates/types/lib/vates/task'
import type { Xapi } from '@vates/types/lib/xen-orchestra/xapi'
import type { XapiHostStats, XapiVmStats, XapiStatsGranularity, XapiPoolStats } from '@vates/types/common'
import type {
  XenApiGpuGroupWrapped,
  XenApiHostWrapped,
  XenApiMessage,
  XenApiNetworkWrapped,
  XenApiPciWrapped,
  XenApiPgpuWrapped,
  XenApiPifWrapped,
  XenApiPoolWrapped,
  XenApiSmWrapped,
  XenApiSrWrapped,
  XenApiVbdWrapped,
  XenApiVdiWrapped,
  XenApiVgpuTypeWrapped,
  XenApiVgpuWrapped,
  XenApiVifWrapped,
  XenApiVmWrapped,
  XenApiVtpmWrapped,
} from '@vates/types/xen-api'
import type {
  AnyXoBackupJob,
  AnyXoJob,
  AnyXoLog,
  XoBackupRepository,
  XoHost,
  XoServer,
  XoUser,
  XapiXoRecord,
  XoVm,
  XoSchedule,
  XoJob,
  XoGroup,
  XoPool,
  XoTask,
  XoProxy,
  XoAuthenticationToken,
  XoVmBackupArchive,
  XoConfigBackupArchive,
  XoPoolBackupArchive,
} from '@vates/types/xo'

import type { InsertableXoServer } from '../servers/server.type.mjs'

type XapiRecordByXapiXoRecord = {
  gpuGroup: XenApiGpuGroupWrapped
  host: XenApiHostWrapped
  message: XenApiMessage
  network: XenApiNetworkWrapped
  PCI: XenApiPciWrapped
  PGPU: XenApiPgpuWrapped
  PIF: XenApiPifWrapped
  pool: XenApiPoolWrapped
  SR: XenApiSrWrapped
  SM: XenApiSmWrapped
  VBD: XenApiVbdWrapped
  VDI: XenApiVdiWrapped
  'VDI-snapshot': XenApiVdiWrapped
  'VDI-unmanaged': XenApiVdiWrapped
  vgpu: XenApiVgpuWrapped
  vgpuType: XenApiVgpuTypeWrapped
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
    abort(id: XoTask['id'], reason?: string): Promise<void>
    clearLogs(): Promise<void>
    create: (params: { name: string; objectId?: string; type?: string }) => VatesTask
    deleteLog(id: XoTask['id']): Promise<void>
    get(id: XoTask['id']): Promise<XoTask>
    list(opts?: { filter?: string | ((obj: XoTask) => boolean); limit?: number }): AsyncGenerator<XoTask>
    watch(id: XoTask['id'], cb: (task: XoTask) => void): Promise<() => void>
  }
  apiContext: {
    user?: XoUser
    permission?: XoUser['permission'] | 'none' | null
  }

  // methods ------------
  addUserToGroup: (userId: XoUser['id'], groupId: XoGroup['id']) => Promise<void>
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  /* Throw if no authorization */
  checkFeatureAuthorization(featureCode: string): Promise<void>
  /* connect a server (XCP-ng/XenServer) */
  connectXenServer(id: XoServer['id']): Promise<void>
  createUser(params: { name?: string; password?: string; [key: string]: unknown }): Promise<XoUser>
  deleteGroup(id: XoGroup['id']): Promise<void>
  deleteUser(id: XoUser['id']): Promise<void>
  /* disconnect a server (XCP-ng/XenServer) */
  createGroup(params: { name: string; provider?: string; providerGroup?: string }): Promise<XoGroup>
  disconnectXenServer(id: XoServer['id']): Promise<void>
  getAllGroups(): Promise<XoGroup[]>
  getAllProxies(): Promise<XoProxy[]>
  getAllJobs<T extends AnyXoBackupJob['type']>(type: T): Promise<Extract<AnyXoBackupJob, { type: T }>[]>
  getAllJobs(type?: string): Promise<AnyXoJob[]>
  getProxy(id: XoProxy['id']): Promise<XoProxy>
  getRemote(id: XoBackupRepository['id']): Promise<XoBackupRepository>
  getAllRemotes(): Promise<XoBackupRepository[]>
  getAllRemotesInfo(): Promise<
    Record<
      XoBackupRepository['id'],
      {
        size?: number
        used?: number
        available?: number
        encryption?: {
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
  getAuthenticationTokensForUser(userId: XoUser['id']): Promise<XoAuthenticationToken[]>
  getBackupNgLogs(): Promise<Record<string, AnyXoLog>>
  getBackupNgLogs(id: AnyXoLog['id']): Promise<AnyXoLog>
  getBackupNgLogsSorted(opts: {
    after?: number
    before?: number
    filter: (log: AnyXoLog) => boolean
    limit?: number
  }): Promise<AnyXoLog[]>
  getGroup(id: XoGroup['id']): Promise<XoGroup>
  getHVSupportedVersions: undefined | (() => Promise<{ [key: XoHost['productBrand']]: string }>)
  getJob<T extends AnyXoJob>(id: T['id']): Promise<T>
  getObject: <T extends XapiXoRecord>(id: T['id'], type?: T['type'] | T['type'][]) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string | ((obj: T) => boolean); limit?: number }
  ) => Record<T['id'], T>
  getTotalBackupSizeOnRemote(id: XoBackupRepository['id']): Promise<{ onDisk: number }>
  getSchedule(id: XoSchedule['id']): Promise<XoSchedule>
  getUser: (id: XoUser['id']) => Promise<XoUser>
  getXapi(maybeId: XapiXoRecord['id'] | XapiXoRecord): Xapi
  getXapiHostStats: (hostId: XoHost['id'], granularity?: XapiStatsGranularity) => Promise<XapiHostStats>
  getXapiObject: <T extends XapiXoRecord>(
    maybeId: T['id'] | T,
    type: T['type'] | T['type'][]
  ) => XapiRecordByXapiXoRecord[T['type']]
  getXapiPoolStats(poolId: XoPool['id'], granularity?: XapiStatsGranularity): Promise<XapiPoolStats>
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  getXenServer(id: XoServer['id']): Promise<XoServer>
  hasFeatureAuthorization(featureCode: string): Promise<boolean>
  hasObject<T extends XapiXoRecord>(id: T['id'], type: T['type']): boolean
  listMetadataBackups(
    backupRepositoryIds: XoBackupRepository['id'][]
  ): Promise<{
    xo: Record<XoBackupRepository['id'], XoConfigBackupArchive[]>
    pool: Record<XoBackupRepository['id'], Record<XoPool['id'], XoPoolBackupArchive[]>>
  }>
  listVmBackupsNg(
    backupRepositoryIds: XoBackupRepository['id'][],
    _forceRefresh?: boolean
  ): Promise<Record<XoBackupRepository['id'], Record<XoVm['id'], XoVmBackupArchive[]>>>
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(body: InsertableXoServer): Promise<XoServer>
  rollingPoolReboot(pool: XoPool, opts?: { parentTask?: VatesTask }): Promise<void>
  rollingPoolUpdate(pool: XoPool, opts?: { rebootVm?: boolean; parentTask?: VatesTask }): Promise<void>
  removeUserFromGroup(userId: XoUser['id'], id: XoGroup['id']): Promise<void>
  runJob(job: XoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
  /** Remove a server from the DB (XCP-ng/XenServer) */
  unregisterXenServer(id: XoServer['id']): Promise<void>
  updateUser(
    id: XoUser['id'],
    updates: {
      /**
       * @deprecated
       */
      email?: string
      authProviders?: Record<string, string>
      name?: string
      password?: string
      permission?: string
      preferences?: Record<string, string>
    }
  ): Promise<void>
  updateGroup(
    id: XoGroup['id'],
    updates: {
      name?: string
    }
  )
}

export type HasNoAuthorization = {
  hasAuthorization: false
}
