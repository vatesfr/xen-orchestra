import type { useRouteQuery as realUseRouteQuery } from '@core/composables/route-query.composable.ts'
import { ref } from 'vue'

// Shared state of the mocked route query: a test sets the query value it needs, reset it in `beforeEach`. Every
// `useRouteQuery` call answers this one query, whatever its name
export const routeQueryMock = {
  query: ref(''),
  reset() {
    this.query.value = ''
  },
}

// Use as `mockModule(import('@core/composables/route-query.composable.ts'), () => import('@/test/mock-route-query.ts'))`
export const useRouteQuery = (() => routeQueryMock.query) as unknown as typeof realUseRouteQuery
