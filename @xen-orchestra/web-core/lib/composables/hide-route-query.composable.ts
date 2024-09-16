import { useRouteQuery } from '@core/composables/route-query.composable'

export function useHideRouteQuery(id: string) {
  return useRouteQuery(id, {
    toData: query => new Set(query ? query.split(',') : undefined),
    toQuery: data => Array.from(data).join(','),
  })
}

export type HideRouteQuery = ReturnType<typeof useHideRouteQuery>
