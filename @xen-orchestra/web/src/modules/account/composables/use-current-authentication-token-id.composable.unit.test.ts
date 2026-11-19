import { useCurrentAuthenticationTokenId } from '@/modules/account/composables/use-current-authentication-token-id.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function clearTokenCookie() {
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

beforeEach(clearTokenCookie)

afterEach(clearTokenCookie)

function mountTokenId() {
  return mountComposable(() => ({ tokenId: useCurrentAuthenticationTokenId() })).wrapper.vm
}

it('is the token of the session stored in the token cookie', () => {
  document.cookie = 'token=session-token-id; path=/'

  expect(mountTokenId().tokenId).toBe('session-token-id')
})

it('is undefined when there is no token cookie', () => {
  expect(mountTokenId().tokenId).toBeUndefined()
})
