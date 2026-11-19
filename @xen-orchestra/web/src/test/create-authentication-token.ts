import type { XoAuthenticationToken, XoUser } from '@vates/types'

/**
 * Builds a fully-populated `XoAuthenticationToken` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createAuthenticationToken(overrides: Partial<XoAuthenticationToken> = {}): XoAuthenticationToken {
  return {
    id: 'authentication-token-123' as XoAuthenticationToken['id'],
    user_id: 'user-123' as XoUser['id'],
    description: 'Test token',
    expiration: 1_900_000_000_000,
    ...overrides,
  }
}
