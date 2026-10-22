import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoUser } from '@vates/types'

export const useXoCurrentUserResource = defineRemoteResource({
  url: `${BASE_URL}/users/me`,
  pollingIntervalMs: false,
  initialData: () => undefined as XoUser | undefined,
  state: currentUser => ({ currentUser }),
})
