// TODO: Use from @vates/types instead
type XoUser = {
  id: string
  permission: string
}

export type XoApp = {
  authenticateUser: (
    params: { token?: string; username?: string; password?: string },
    optional?: { ip?: string }
  ) => Promise<{ bypassOtp: boolean; user: XoUser }>
  runWithApiContext: (user: XoUser, fn: () => void) => Promise<unknown>
}
