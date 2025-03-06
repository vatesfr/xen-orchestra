import type { XapiVmStats, XapiStatsGranularity } from '@vates/types/common'
import type { XoUser, XapiXoRecord, XoVm } from '@vates/types/xo'

export type XoApp = {
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  getObject: <T extends XapiXoRecord>(id: T['id'], type: T['type']) => T
  getObjectsByType: <T extends XapiXoRecord>(
    type: T['type'],
    opts?: { filter?: string; limit?: number }
  ) => Record<T['id'], T>
  getXapiVmStats: (vmId: XoVm['id'], granularity?: XapiStatsGranularity) => Promise<XapiVmStats>
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
