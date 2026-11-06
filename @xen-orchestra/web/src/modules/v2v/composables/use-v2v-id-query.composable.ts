import { useRouteQuery } from '@core/composables/route-query.composable.ts'

// An id the wizard keeps in the route, `undefined` while the route holds none: a reload or a shared link reopens it
export function useV2vIdQuery<TId extends string>(name: string) {
  return useRouteQuery<TId | undefined>(name, {
    toData: query => (query === '' ? undefined : (query as TId)),
    toQuery: id => id ?? '',
  })
}
