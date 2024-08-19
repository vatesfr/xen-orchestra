import { handleAdd } from '@core/composables/route-query/actions/handle-add'
import { handleDelete } from '@core/composables/route-query/actions/handle-delete'
import { handleSet } from '@core/composables/route-query/actions/handle-set'
import { handleToggle } from '@core/composables/route-query/actions/handle-toggle'
import type { Actions, Options, RouteQuery, Transformers } from '@core/composables/route-query/types'
import { extendRef } from '@vueuse/core'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useRouteQuery<TData extends string>(name: string): RouteQuery<TData>
export function useRouteQuery<TData extends string>(name: string, options: Options): RouteQuery<TData>
export function useRouteQuery<TData>(name: string, options: Options & Transformers<TData>): RouteQuery<TData>
export function useRouteQuery<TData>(name: string, options: Partial<Options & Transformers<TData>> = {}) {
  const router = useRouter()
  const route = useRoute()

  const {
    defaultQuery = '',
    toData = (query: string) => query as TData,
    toQuery = (data: TData) => data as string,
  } = options

  const source = computed<TData>({
    get() {
      return toData((route.query[name] as string | undefined) ?? defaultQuery)
    },
    set(newData) {
      const query = toQuery(newData)

      void router.replace({ query: { ...route.query, [name]: query === defaultQuery ? undefined : query } })
    },
  })

  const actions: Actions = {
    add: handleAdd.bind(null, source),
    delete: handleDelete.bind(null, source),
    set: handleSet.bind(null, source),
    toggle: handleToggle.bind(null, source),
  }

  return extendRef(source, actions) as unknown as RouteQuery<TData>
}
