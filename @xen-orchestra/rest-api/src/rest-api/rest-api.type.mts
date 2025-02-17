import type { XoUser } from '@vates/types/xo'

export type XoApp = {
  authenticateUser: (
    credentials: { token?: string; username?: string; password?: string },
    userData?: { ip?: string },
    opts?: { bypassOtp?: boolean }
  ) => Promise<{ bypassOtp: boolean; expiration: number; user: XoUser }>
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
