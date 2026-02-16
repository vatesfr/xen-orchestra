import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export type FrontXoUser = Pick<XoUser, (typeof userFields)[number]>

const userFields = ['id', 'name', 'permission', 'email', 'groups'] as const satisfies readonly (keyof XoUser)[]

export const useXoUserCollection = defineRemoteResource({
  url: `${BASE_URL}/users?fields=${userFields.join(',')}`,

  initialData: () => [] as Pick<XoUser, (typeof userFields)[number]>[],
  state: (users, context) => {
    return useXoCollectionState(users, {
      context,
      baseName: 'user',
    })
  },
})
