import type { XoUser, XapiXoRecord } from '@vates/types/xo'

/* VM: XoVm */
export type XapiXoRecordByType = {
  [K in XapiXoRecord['type']]: Extract<XapiXoRecord, { type: K }>
}

/* VM: Record<Branded<'VM'>, XoVm> */
export type XapiXoBrandedRecordByType = {
  [K in XapiXoRecord as K['type']]: Record<K['id'], K>
}

export type XoApp = {
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  getObject: <T extends XapiXoRecord>(id: T['id'], type: XapiXoRecord['type']) => T
  getObjectsByType: <T extends keyof XapiXoRecordByType>(
    type: T,
    opts?: { filter?: string; limit?: number }
  ) => XapiXoBrandedRecordByType[T]
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
