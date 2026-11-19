import type { useXoUserResource as realUseXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'

// Shared state of the mocked user resource: a test asserts the reload it triggers, reset it in `beforeEach`
export const xoUserMock = {
  forceReload: vi.fn(),
  reset() {
    this.forceReload.mockReset()
  },
}

// Use as `vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))`
export const useXoUserResource = (() => ({
  $context: { forceReload: xoUserMock.forceReload },
})) as unknown as typeof realUseXoUserResource
