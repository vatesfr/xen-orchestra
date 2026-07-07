import { EventEmitter } from 'node:stream'
import type {
  AnyXoBackupJob,
  AnyXoJob,
  AnyXoLog,
  XapiXoRecord,
  XoAuthenticationToken,
  XoBackupRepository,
  XoConfigBackupArchive,
  XoGroup,
  XoHost,
  XoPool,
  XoPoolBackupArchive,
  XoProxy,
  XoSchedule,
  XoServer,
  XoTask,
  XoUser,
  XoVif,
  XoVm,
  XoVmBackupArchive,
} from './xo.mjs'
import { VatesTask } from './lib/vates-task.mjs'
import {
  Xapi,
  XapiHostStats,
  XapiPoolStats,
  XapiStatsGranularity,
  XapiVmStats,
  XenApiGpuGroupWrapped,
  XenApiHostWrapped,
  XenApiMessageWrapped,
  XenApiNetworkWrapped,
  XenApiPbdWrapped,
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
  XoAclBasePrivilege,
  XoAclRole,
  XoGroupRole,
  XoUserRole,
} from './index.mjs'

type FeatureCode =
  | 'BACKUP.DELTA'
  | 'BACKUP.DELTA_REPLICATION'
  | 'BACKUP.FULL'
  | 'BACKUP.HEALTHCHECK'
  | 'BACKUP.METADATA'
  | 'BACKUP.MIRROR'
  | 'BACKUP.WITH_RAM'
  | 'BACKUP.SMART_BACKUP'
  | 'BACKUP.S3'
  | 'DOCKER'
  | 'EXPORT.XVA'
  | 'LIST_MISSING_PATCHES'
  | 'POOL_EMERGENCY_SHUTDOWN'
  | 'RBAC'
  | 'ROLLING_POOL_UPDATE'
  | 'ROLLING_POOL_REBOOT'
  | 'SMART_REBOOT'
  | 'WARM_MIGRATION'
  | 'PLUGIN.OPENMETRICS'

type XapiRecordByXapiXoRecord = {
  gpuGroup: XenApiGpuGroupWrapped
  host: XenApiHostWrapped
  message: XenApiMessageWrapped
  network: XenApiNetworkWrapped
  PBD: XenApiPbdWrapped
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

type LicenseProductId =
  | 'premium'
  | 'xcpng-enterprise'
  | 'xcpng-standard'
  | 'xo-proxy'
  | 'xosan.trial'
  | 'xostor'
  | 'xostor.trial'
type LicenseProductType = 'xo' | 'xoproxy' | 'xcpng' | 'xosan' | 'xostor'

type License = {
  id: string
  type: 'license'
  created: number
  licenseType: 'unit'
  productId: LicenseProductId
  tags: string[]
  expires?: number
  boundObjectId?: string
  bindDate?: number
  buyer?: { token: string; email: string }
  history?: { date: number; boundObjectId: string }[]
  rebound?: number
  productTypes?: LicenseProductType[]
  bundleInfo?: { name: string; id: string }
}

export type XoApp = {
  hooks: EventEmitter
  _redis: {
    get(key: string): Promise<string | null>
    mSet(args: string[]): Promise<unknown>
    sMembers(key: string): Promise<string[]>
    sIsMember(key: string, member: string): Promise<boolean>
  }
  config: {
    get<T = string>(path: string): T
    getOptional<T = unknown>(path: string): T | undefined
    getOptionalDuration(path: string): number | undefined
    getGuiRoutes(): Promise<{
      default: {
        url: string
        path: string
      }
      v5?: {
        url: string
        path: string
      }
      v6?: {
        url: string
        path: string
      }
      [key: string]:
        | undefined
        | {
            url: string
            path: string
          }
    }>
  }

  objects: EventEmitter & {
    allIndexes: {
      type: {
        getEventEmitterByType(type: XapiXoRecord['type']): EventEmitter
      }
    }
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
  allocIpAddresses(vifId: XoVif['id'], addAddresses?: string[], removeAddresses?: string[]): Promise<void>
  addAclV2GroupRole(groupId: XoGroup['id'], roleId: XoAclRole['id']): Promise<XoGroupRole>
  addAclV2UserRole(userId: XoUser['id'], roleId: XoAclRole['id']): Promise<XoUserRole>
  addUserToGroup: (userId: XoUser['id'], groupId: XoGroup['id']) => Promise<void>
  addApiMethod: <A extends unknown[], R>(
    name: string,
    method: (...args: A) => Promise<R>,
    //we use any since it is a legacy call, might be better typed in another pr
    info: {
      resolve?: any
      params?: any
    }
  ) => () => void // eslint-disable-line @typescript-eslint/no-explicit-any
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean; bypassTaskCreation?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  backupGuard(poolId: XoPool['id']): Promise<void>
  /* Throw if no authorization */
  checkFeatureAuthorization(featureCode: FeatureCode): Promise<void>
  /* connect a server (XCP-ng/XenServer) */
  connectXenServer(id: XoServer['id']): Promise<void>
  // TODO: replace all XoAclBasePrivilege with a more strict type. (discriminate union)
  createAclV2Privilege(
    privilege: Omit<XoAclBasePrivilege, 'id'>,
    options?: {
      force?: boolean
    }
  ): Promise<XoAclBasePrivilege>
  copyAclV2Role(
    id: XoAclRole['id'],
    params?: { name?: XoAclRole['name']; description?: XoAclRole['description'] }
  ): Promise<XoAclRole['id']>
  createAclV2Role(role: { name: XoAclRole['name']; description?: XoAclRole['description'] }): Promise<XoAclRole>
  createAuthenticationToken(opts: {
    client?: {
      id?: string
      [key: string]: unknown
    }
    description?: string
    expiresIn?: string | number
    userId: XoUser['id']
  }): Promise<XoAuthenticationToken>
  createRemote(params: {
    name: string
    options?: string
    proxy?: XoProxy['id']
    url: string
  }): Promise<XoBackupRepository>
  createUser(params: { name?: string; password?: string; [key: string]: unknown }): Promise<XoUser>
  deleteAclV2GroupRole(groupId: XoGroup['id'], roleId: XoAclRole['id']): Promise<boolean>
  deleteAclV2Privilege(privilegeId: XoAclBasePrivilege['id'], options?: { force?: boolean }): Promise<boolean>
  deleteAclV2Role(roleId: XoAclRole['id'], options?: { force?: boolean }): Promise<boolean>
  deleteGroup(id: XoGroup['id']): Promise<void>
  deleteUser(id: XoUser['id']): Promise<void>
  detachHostFromPool(hostId: XoHost['id']): Promise<void>
  createGroup(params: { name: string; provider?: string; providerGroup?: string }): Promise<XoGroup>
  /* disconnect a server (XCP-ng/XenServer) */
  disconnectXenServer(id: XoServer['id']): Promise<void>
  findEnabledScheduleSequenceFromSchedule(id: XoSchedule['id']): Promise<XoSchedule | undefined>
  getAclV2Privilege(id: XoAclBasePrivilege['id']): Promise<XoAclBasePrivilege>
  getAclV2Privileges(): Promise<XoAclBasePrivilege[]>
  getAclV2RolePrivileges(roleId: XoAclRole['id']): Promise<XoAclBasePrivilege[]>
  getAclV2Role(id: XoAclRole['id']): Promise<XoAclRole>
  deleteAclV2UserRole(userId: XoUser['id'], roleId: XoAclRole['id']): Promise<boolean>
  getAclV2GroupRoles(groupId: XoGroup['id']): Promise<Exclude<XoAclRole, { isTemplate: true }>[]>
  getAclV2Roles(): Promise<XoAclRole[]>
  getAclV2UserPrivileges(userId: XoUser['id']): Promise<XoAclBasePrivilege[]>
  getAllGroups(): Promise<XoGroup[]>
  getAllProxies(): Promise<XoProxy[]>
  getAllJobs<T extends AnyXoJob['type']>(type: T): Promise<Extract<AnyXoJob, { type: T }>[]>
  getAllJobs(type?: string): Promise<AnyXoJob[]>
  getProxy(id: XoProxy['id']): Promise<XoProxy>
  getRemote(id: XoBackupRepository['id']): Promise<XoBackupRepository>
  getAllRemotes(): Promise<XoBackupRepository[]>
  removeRemote(id: XoBackupRepository['id']): Promise<void>
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
  ) => Record<T['id'], T> | undefined
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
  listMetadataBackups(backupRepositoryIds: XoBackupRepository['id'][]): Promise<{
    xo: Record<XoBackupRepository['id'], XoConfigBackupArchive[]>
    pool: Record<XoBackupRepository['id'], Record<XoPool['id'], XoPoolBackupArchive[]>>
  }>
  listVmBackupsNg(
    backupRepositoryIds: XoBackupRepository['id'][],
    opts?: { _forceRefresh?: boolean; vmId: XoVm['id'] }
  ): Promise<Record<XoBackupRepository['id'], Record<XoVm['id'], XoVmBackupArchive[]>>>
  pingRemote(id: XoBackupRepository['id']): Promise<{ success: true }>
  /** Allow to add a new server in the DB (XCP-ng/XenServer) */
  registerXenServer(
    body: Pick<XoServer, 'host' | 'httpProxy' | 'label' | 'username'> & {
      allowUnauthorized?: XoServer['allowUnauthorized']
      password: string
      readOnly?: XoServer['readOnly']
    }
  ): Promise<XoServer>
  rollingPoolReboot(pool: XoPool, opts?: { parentTask?: VatesTask }): Promise<void>
  rollingPoolUpdate(pool: XoPool, opts?: { rebootVm?: boolean; parentTask?: VatesTask }): Promise<void>
  setVmResourceSet(vmId: XoVm['id'], resourceSetId: string | null, force?: boolean): Promise<void>
  shareVmResourceSet(vmId: XoVm['id']): Promise<void>
  removeUserFromGroup(userId: XoUser['id'], id: XoGroup['id']): Promise<void>
  runJob(job: AnyXoJob, schedule: XoSchedule): void
  runWithApiContext: (user: XoUser | undefined, fn: () => void) => Promise<unknown>
  testRemote(
    id: XoBackupRepository['id']
  ): Promise<
    | { success: true; readRate: number; writeRate: number }
    | { success: false; step: string; file: string; error: unknown }
  >
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
  updateAclV2Privilege(
    privilegeId: XoAclBasePrivilege['id'],
    privilege: XoAclBasePrivilege
  ): Promise<XoAclBasePrivilege>
  updateAclV2Role(
    roleId: XoAclRole['id'],
    role: {
      name?: XoAclRole['name']
      description?: XoAclRole['description'] | null
    },
    options?: {
      force?: boolean
    }
  ): Promise<XoAclRole>
  updateGroup(
    id: XoGroup['id'],
    updates: {
      name?: string
    }
  ): void
  updateRemote(
    id: XoBackupRepository['id'],
    params: {
      enabled?: boolean
      name?: string
      options?: string | null
      proxy?: XoProxy['id'] | null
      url?: string
    }
  ): Promise<XoBackupRepository>
  getAllXapis(): Record<string, Xapi>
  getObjects(opts?: { filter?: Record<string, unknown>; limit?: number }): Record<string, XapiXoRecord>
  getLicenses(params?: { productType?: LicenseProductType }): Promise<License[]>
  bindLicense(params: { licenseId: string; boundObjectId: string }): Promise<License>
  unbindLicense(params: {
    productId: LicenseProductId
    boundObjectId: string
    licenseId: string
    data?: Record<string, string>
  }): Promise<License>
}
