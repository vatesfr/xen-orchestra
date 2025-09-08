import type { XoUser } from '@/types/xo/user.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoUserResource = defineRemoteResource({
  url: (userId: string) => `/rest/v0/users/${userId}`,
  initialData: () => undefined as XoUser | undefined,
  state: user => ({ user }),
})
