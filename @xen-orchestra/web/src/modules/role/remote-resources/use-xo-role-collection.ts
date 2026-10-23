import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclRole } from '@vates/types'

export type FrontXoRole = Pick<
  Exclude<XoAclRole, { isTemplate: true }>,
  'id' | 'name' | 'description' | 'userIds' | 'groupIds' | 'privilegeIds'
>

const roleFields = [
  'id',
  'name',
  'description',
  'userIds',
  'groupIds',
  'privilegeIds',
] as const satisfies readonly (keyof FrontXoRole)[]

export const useXoRoleCollection = defineRemoteResource({
  url: `${BASE_URL}/acl-roles?fields=${roleFields.join(',')}&filter=!isTemplate?&ndjson=true`,
  stream: true,
  initWatchCollection: () =>
    useWatchCollection({
      resource: 'acl-role',
      fields: [...roleFields, 'isTemplate'],
      predicate: role => !('isTemplate' in role),
    }),
  initialData: () => [] as FrontXoRole[],
  state: (roles, context) => {
    return useXoCollectionState(roles, {
      context,
      baseName: 'role',
    })
  },
})
