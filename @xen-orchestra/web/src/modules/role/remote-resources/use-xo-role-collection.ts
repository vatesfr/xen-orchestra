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
  // Template roles are excluded: they are blueprints to copy, not roles to assign.
  url: `${BASE_URL}/acl-roles?fields=${roleFields.join(',')}&filter=!isTemplate?`,

  initialData: () => [] as FrontXoRole[],
  state: (roles, context) => {
    return useXoCollectionState(roles, {
      context,
      baseName: 'role',
    })
  },
})
