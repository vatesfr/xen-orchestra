import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import type { ColumnSortDirection } from '@core/packages/table/types.ts'

export type RouteQuerySort = { id: string; direction: ColumnSortDirection }

function isSortDirection(direction: string | undefined): direction is ColumnSortDirection {
  return direction === 'asc' || direction === 'desc'
}

function toQuery(sort: RouteQuerySort | undefined) {
  return sort ? [sort.id, sort.direction].join(',') : ''
}

export function useSortRouteQuery(name: string, defaultSort?: RouteQuerySort) {
  return useRouteQuery<RouteQuerySort | undefined>(name, {
    defaultQuery: toQuery(defaultSort),
    toData: query => {
      const [id, direction] = query.split(',')

      if (!id || !isSortDirection(direction)) {
        return undefined
      }

      return { id, direction }
    },
    toQuery,
  })
}

export type SortRouteQuery = ReturnType<typeof useSortRouteQuery>
