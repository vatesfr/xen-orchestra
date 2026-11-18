import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import type { XoUser } from '@vates/types'

export function getXoUserSshKeys(user: XoUser) {
  return (user.preferences?.sshKeys as unknown as SshKey[] | undefined) ?? []
}

export function isXoUserOtpEnabled(user: XoUser) {
  return user.preferences?.otp !== undefined
}

export function isXoUserSynchronized(user: XoUser) {
  return Object.keys(user.authProviders ?? {}).length > 0
}
