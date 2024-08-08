import { type Ref, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Options = {
  defaultQuery?: string
}

type Transformers<TData> = {
  toData: (value: string) => TData
  toQuery: (value: TData) => string
}

export function useRouteQuery(name: string): Ref<string>
export function useRouteQuery(name: string, options: Options): Ref<string>
export function useRouteQuery<TData>(name: string, options: Options & Transformers<TData>): Ref<TData>
export function useRouteQuery<TData>(name: string, options: Partial<Options & Transformers<TData>> = {}) {
  const router = useRouter()
  const route = useRoute()

  const data = ref() as Ref<TData>

  const {
    defaultQuery = '',
    toData = (value: string) => value as unknown as TData,
    toQuery = (value: TData) => value as unknown as string,
  } = options

  watch(
    data,
    newData => {
      const query = toQuery(newData)
      void router.replace({ query: { ...route.query, [name]: query === defaultQuery ? undefined : query } })
    },
    { deep: true }
  )

  watch(
    () => route.query[name] as string | undefined,
    newQuery => {
      data.value = toData(newQuery ?? defaultQuery)
    },
    { immediate: true }
  )

  return data
}
