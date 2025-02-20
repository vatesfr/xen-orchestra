import type { XoUser, XapiXoRecord } from '@vates/types/xo'

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
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
