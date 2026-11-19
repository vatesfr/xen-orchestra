import { getXoUserSshKeys, isXoUserOtpEnabled, isXoUserSynchronized } from '@/modules/user/utils/xo-user.util.ts'
import { createUser } from '@/test/create-user.ts'

describe('getXoUserSshKeys', () => {
  it('returns the SSH keys of the preferences', () => {
    const sshKeys = [{ title: 'Laptop', key: 'ssh-rsa AAA' }]
    const user = createUser({ preferences: { sshKeys } as unknown as Record<string, string> })

    expect(getXoUserSshKeys(user)).toEqual(sshKeys)
  })

  it('returns no key for a user without SSH keys', () => {
    expect(getXoUserSshKeys(createUser())).toEqual([])
  })
})

describe('isXoUserOtpEnabled', () => {
  it('is enabled when the preferences hold an OTP secret', () => {
    expect(isXoUserOtpEnabled(createUser({ preferences: { otp: 'SECRET' } }))).toBe(true)
  })

  it('is disabled without OTP secret', () => {
    expect(isXoUserOtpEnabled(createUser())).toBe(false)
  })
})

describe('isXoUserSynchronized', () => {
  it('is synchronized when the user comes from an auth provider', () => {
    expect(isXoUserSynchronized(createUser({ authProviders: { ldap: 'user-1' } }))).toBe(true)
  })

  it('is not synchronized without auth provider', () => {
    expect(isXoUserSynchronized(createUser({ authProviders: {} }))).toBe(false)
  })

  it('is not synchronized when the user has no auth providers field', () => {
    expect(isXoUserSynchronized(createUser())).toBe(false)
  })
})
