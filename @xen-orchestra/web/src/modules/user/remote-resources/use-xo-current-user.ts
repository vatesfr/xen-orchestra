import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export const useXoCurrentUser = defineRemoteResource({
  url: `${BASE_URL}/users/me`,
  initialData: () => undefined as XoUser | undefined,
  state: currentUser => ({ currentUser }),
})
