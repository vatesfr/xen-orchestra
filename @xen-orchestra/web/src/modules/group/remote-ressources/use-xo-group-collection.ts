import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoGroup } from '@vates/types'

export type FrontXoGroup = Pick<XoGroup, (typeof groupFields)[number]>

const groupFields = ['id', 'name'] as const satisfies readonly (keyof XoGroup)[]

export const useXoGroupCollection = defineRemoteResource({
  url: `${BASE_URL}/groups?fields=${groupFields.join(',')}`,

  initialData: () => [] as FrontXoGroup[],
  state: (groups, context) => {
    return useXoCollectionState(groups, {
      context,
      baseName: 'group',
    })
  },
})
