import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { AnyPrivilege } from '@xen-orchestra/acl'

const privilegeFields = ['resource', 'action', 'effect', 'selector'] as const satisfies readonly (keyof AnyPrivilege)[]

export const useXoCurrentUserPrivilegeCollection = defineRemoteResource({
  url: `${BASE_URL}/users/me/acl-privileges?fields=${privilegeFields.join(',')}`,
  initialData: () => [] as AnyPrivilege[],
  state: (currentUserPrivileges, context) => ({
    currentUserPrivileges,
    areCurrentUserPrivilegesReady: context.isReady,
  }),
})
