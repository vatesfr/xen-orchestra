import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoAclBasePrivilege } from '@vates/types'

export const useXoPrivilegeResource = defineRemoteResource({
  url: (privilegeId: string) => `${BASE_URL}/acl-privileges/${privilegeId}`,
  initialData: () => undefined as XoAclBasePrivilege | undefined,
  state: (privilege, context) => ({
    privilege,
    isPrivilegeReady: context.isReady,
  }),
})
