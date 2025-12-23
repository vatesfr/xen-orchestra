import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export const useXoUserResource = defineRemoteResource({
  url: (userId: string | undefined) => (userId !== undefined ? `/rest/v0/users/${userId}` : ''),
  initialData: () => undefined as XoUser | undefined,
  state: user => ({ user }),
})
