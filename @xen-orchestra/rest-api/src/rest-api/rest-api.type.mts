import type { XoUser, XapiXoRecord } from '@vates/types/xo'

/* VM: XoVm */
export type XapiXoRecordByType = {
  [T in XapiXoRecord['type']]: Extract<XapiXoRecord, { type: T }>
}

/* VM: Record<Branded<'VM'>, XoVm> */
export type XapiXoBrandedRecordByType = {
  [T in XapiXoRecord['type']]: Record<XapiXoRecordByType[T]['id'], T>
}

export type XoApp = {
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  getObject: <T extends keyof XapiXoRecordByType>(id: XapiXoRecordByType[T]['id'], type: T) => XapiXoRecordByType[T]
  getObjectsByType: <T extends keyof XapiXoRecordByType>(
    type: T,
    opts?: { filter?: string; limit?: number }
  ) => XapiXoBrandedRecordByType[T]
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
