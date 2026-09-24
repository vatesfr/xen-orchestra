import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAuthenticationToken } from '@vates/types'
import { toValue } from 'vue'

export const useXoUserAuthenticationTokensCollection = defineRemoteResource({
  url: (userId: FrontXoUser['id']) => `${BASE_URL}/users/${userId}/authentication_tokens`,
  stream: true,
  initWatchCollection: () =>
    useWatchCollection<XoAuthenticationToken>({
      resource: 'authentication_token',
      predicate(obj, context) {
        if (context === undefined || context.args === undefined || Array.isArray(obj)) {
          return true
        }

        const [id] = context.args
        const userId = toValue(id)
        return obj.user_id === userId
      },
    }),
  initialData: () => [] as XoAuthenticationToken[],
  state: (userAuthenticationTokens, context) => ({
    userAuthenticationTokens,
    areUserAuthenticationTokensReady: context.isReady,
    areUserAuthenticationTokensFetchError: context.hasError,
  }),
})
