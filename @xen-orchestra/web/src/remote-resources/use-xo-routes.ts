import type { XoRoutes } from '@/types/xo/xo-routes.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoRoutes = defineRemoteResource({
  url: '/rest/v0/gui-routes',
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as XoRoutes | undefined,
  state: (routes, context) => {
    return {
      routes,
      hasError: context.hasError,
    }
  },
})
