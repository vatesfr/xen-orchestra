import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAuthenticationToken } from '@vates/types'

export const useXoUserAuthenticationTokensCollection = defineRemoteResource({
  url: (userId: FrontXoUser['id']) => `${BASE_URL}/users/${userId}/authentication_tokens`,
  initialData: () => [] as XoAuthenticationToken[],
  state: (userAuthenticationTokens, context) => ({
    userAuthenticationTokens,
    areUserAuthenticationTokensReady: context.isReady,
    areUserAuthenticationTokensFetchError: context.hasError,
  }),
})
