import type { XoRoutes } from '@/types/xo/xo-routes.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed, watchEffect } from 'vue'

export const useXoRoutes = defineRemoteResource({
  url: '/rest/v0/gui-routes',
  cacheExpirationMs: false,
  pollingIntervalMs: false,
  initialData: () => undefined as XoRoutes | undefined,
  state: (routes, context) => {
    const xo5Route = computed(() => {
      if (routes.value?.xo5 === undefined) {
        return undefined
      }

      return `${routes.value.xo5.replace(/\/$/, '')}/#`
    })

    function buildXo5Route(path: string): string | undefined {
      return xo5Route.value !== undefined ? `${xo5Route.value}${path}` : undefined
    }

    watchEffect(() => {
      if (context.hasError.value) {
        console.error('Failed to fetch XO routes')
      }
    })

    return {
      routes,
      buildXo5Route,
      hasXoRoutesError: context.hasError,
    }
  },
})
