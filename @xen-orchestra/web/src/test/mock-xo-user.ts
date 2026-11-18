import type { useXoUserResource as realUseXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import type { XoUser } from '@vates/types'
import { ref } from 'vue'

// Shared state of the mocked user resource: a test sets the user it fetches, reset it in `beforeEach`
export const userResourceMock = {
  user: ref<XoUser>(),
  reset() {
    this.user.value = undefined
  },
}

// Use as `mockModule(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))`
export const useXoUserResource = (() => ({ user: userResourceMock.user })) as unknown as typeof realUseXoUserResource
