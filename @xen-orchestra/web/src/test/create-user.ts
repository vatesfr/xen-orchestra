import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import type { XoUser } from '@vates/types'

/**
 * Builds a fully-populated `XoUser` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createUser(overrides: Partial<XoUser> = {}): XoUser {
  return {
    id: 'user-123' as XoUser['id'],
    email: 'user@example.org',
    username: 'user',
    groups: [],
    permission: 'none',
    preferences: {},
    ...overrides,
  }
}

export function createUserWithSshKeys(sshKeys: SshKey[], overrides: Partial<XoUser> = {}): XoUser {
  return createUser({ preferences: { sshKeys } as unknown as XoUser['preferences'], ...overrides })
}
