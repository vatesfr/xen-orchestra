import {
  getXoAuthenticationTokenLabel,
  getXoAuthenticationTokenLastUse,
} from '@/modules/account/utils/xo-authentication-token.util.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import type { XoAuthenticationToken } from '@vates/types'

describe('getXoAuthenticationTokenLabel', () => {
  it('shows the beginning of the token id, followed by an ellipsis', () => {
    const token = createAuthenticationToken({ id: 'abcdefghijkl' as XoAuthenticationToken['id'] })

    expect(getXoAuthenticationTokenLabel(token)).toBe('abcde…')
  })
})

describe('getXoAuthenticationTokenLastUse', () => {
  it('is undefined for a token never used', () => {
    expect(getXoAuthenticationTokenLastUse(createAuthenticationToken())).toBeUndefined()
  })

  it('is undefined for a token with empty uses', () => {
    expect(getXoAuthenticationTokenLastUse(createAuthenticationToken({ last_uses: {} }))).toBeUndefined()
  })

  it('returns the only use of the token', () => {
    const token = createAuthenticationToken({ last_uses: { '10.0.0.1': { timestamp: 1000 } } })

    expect(getXoAuthenticationTokenLastUse(token)).toEqual({ ip: '10.0.0.1', timestamp: 1000 })
  })

  it('returns the most recent use among several IPs', () => {
    const token = createAuthenticationToken({
      last_uses: {
        '10.0.0.1': { timestamp: 1000 },
        '10.0.0.2': { timestamp: 3000 },
        '10.0.0.3': { timestamp: 2000 },
      },
    })

    expect(getXoAuthenticationTokenLastUse(token)).toEqual({ ip: '10.0.0.2', timestamp: 3000 })
  })
})
