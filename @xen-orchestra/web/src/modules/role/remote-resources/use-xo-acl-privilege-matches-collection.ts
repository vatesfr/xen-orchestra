import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclBasePrivilege } from '@vates/types'

export type AclPrivilegeMatch = Pick<XoAclBasePrivilege, 'id' | 'roleId' | 'resource' | 'action' | 'effect'>

const aclPrivilegeFields = [
  'id',
  'roleId',
  'resource',
  'action',
  'effect',
] as const satisfies readonly (keyof AclPrivilegeMatch)[]

export const useXoAclPrivilegeMatchesCollection = defineRemoteResource({
  url: (selector: string) => {
    const url = `${BASE_URL}/acl-privileges?fields=${aclPrivilegeFields.join(',')}`

    return selector === '' ? url : `${url}&filter=${encodeURIComponent(selector)}`
  },

  initialData: () => [] as AclPrivilegeMatch[],

  pollingIntervalMs: false,

  state: privileges => ({ privileges }),
})
