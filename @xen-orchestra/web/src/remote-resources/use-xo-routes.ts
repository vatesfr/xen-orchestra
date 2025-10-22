import type { XoRoutes } from '@/types/xo/xo-routes.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoRoutes = defineRemoteResource({
  url: '/rest/v0/gui-routes',
  pollingIntervalMs: 0,
  initialData: () => ({}) as XoRoutes,
  state: (rawRoutes, context) => {
    return {
      rawRoutes,
      hasError: context.hasError,
    }
  },
})
