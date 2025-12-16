import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { watchCollectionWrapper } from '@/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

const userFields: (keyof XoUser)[] = ['id', 'name', 'permission', 'email', 'groups'] as const

export const useXoUserCollection = defineRemoteResource({
  url: `/rest/v0/users?fields=${userFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'user', fields: userFields }),
  initialData: () => [] as XoUser[],
  state: (users, context) => {
    return useXoCollectionState(users, {
      context,
      baseName: 'user',
    })
  },
})
