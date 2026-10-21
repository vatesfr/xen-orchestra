import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

// The destination pool lives in the route: a reload or a shared link reopens the wizard on it
export function useV2vPoolQuery() {
  return useRouteQuery<FrontXoPool['id'] | undefined>('pool', {
    toData: query => (query === '' ? undefined : (query as FrontXoPool['id'])),
    toQuery: pool => pool ?? '',
  })
}
