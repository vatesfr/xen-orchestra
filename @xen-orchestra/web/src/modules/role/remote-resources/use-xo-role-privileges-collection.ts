import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclBasePrivilege, XoAclRole } from '@vates/types'

export type FrontXoPrivilege = Pick<XoAclBasePrivilege, 'id' | 'resource' | 'action' | 'selector' | 'effect'>

const privilegeFields = [
  'id',
  'resource',
  'action',
  'selector',
  'effect',
] as const satisfies readonly (keyof FrontXoPrivilege)[]

export const useXoRolePrivilegesCollection = defineRemoteResource({
  url: (roleId: XoAclRole['id']) => `${BASE_URL}/acl-roles/${roleId}/privileges?fields=${privilegeFields.join(',')}`,

  initialData: () => [] as FrontXoPrivilege[],
  state: (privileges, context) => {
    return useXoCollectionState(privileges, {
      context,
      baseName: 'privilege',
    })
  },
})
