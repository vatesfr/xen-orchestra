import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export const useXoUserResource = defineRemoteResource({
  url: (userId: string | undefined) => (userId !== undefined ? `${BASE_URL}/users/${userId}` : ''),
  initialData: () => undefined as XoUser | undefined,
  state: user => ({ user }),
})
