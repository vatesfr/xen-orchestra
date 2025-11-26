import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export const useXoUserCollection = defineRemoteResource({
  url: `/rest/v0/users?fields=id,name,permissions,id,email,groups`,
  initialData: () => [] as XoUser[],
  state: (users, context) => {
    return useXoCollectionState(users, {
      context,
      baseName: 'user',
    })
  },
})
