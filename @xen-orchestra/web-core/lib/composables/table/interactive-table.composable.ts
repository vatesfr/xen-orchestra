import { interactionsFn, parseColumnName, type InteractionId } from '@core/utils/interactive-table.util'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const useInteractiveTable = <T extends unknown[]>(
  data: T,
  tableName: string,

  /**
   * `<column name, the property that corresponds to this column>`
   *
   * E.g. `{ vm: 'name_label' }`. The column named `vm` will search for `obj.name_label` and not `obj.vm`
   */
  customPath?: Record<string, string>
) => {
  const route = useRoute()
  const queries = computed(() =>
    Object.keys(route.query).reduce(
      (_queries, columnName) => {
        const parsedColumnName = parseColumnName(columnName)
        if (parsedColumnName.tableName === tableName) {
          _queries[parsedColumnName.columnId] = route.query[columnName] as string
        }
        return _queries
      },
      {} as Record<string, string>
    )
  )

  const processedData = computed(() => {
    Object.keys(queries.value).forEach(property => {
      let path = property
      if (customPath !== undefined && property in customPath) {
        path = customPath[property]
      }
      const interactionId = queries.value[property] as InteractionId
      const fn = interactionsFn[interactionId]

      if (typeof fn !== 'function') {
        console.warn('Invalid interaction: ', interactionId)
        return
      }

      data = fn(data, path)
    })

    return data
  })

  return { data: processedData }
}
