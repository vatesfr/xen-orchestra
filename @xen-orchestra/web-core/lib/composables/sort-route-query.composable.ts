import { useRouteQuery } from '@core/composables/route-query.composable'

export function useSortRouteQuery(id: string) {
  return useRouteQuery(id, {
    toData: query => {
      if (!query) {
        return undefined
      }

      const [id, direction] = query.split(',') as [string, 'asc' | 'desc']

      return { id, direction }
    },
    toQuery: data => (data ? [data.id, data.direction].join(',') : ''),
  })
}

export type SortRouteQuery = ReturnType<typeof useSortRouteQuery>
