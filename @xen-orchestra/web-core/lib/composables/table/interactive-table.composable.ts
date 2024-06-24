import { interactionsFn, parseColumnName, type InteractionId } from '@core/utils/interactive-table.util'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export const useInteractiveTable = <T extends unknown[]>(
  data: T,
  tableName: string,
  customPath: Record<string, string>
) => {
  const route = useRoute()
  const queries = computed(() =>
    Object.keys(route.query).reduce(
      (acc, columnName) => {
        const parsedColumnName = parseColumnName(columnName)
        if (parsedColumnName.tableName === tableName) {
          acc[parsedColumnName.columnId] = route.query[columnName] as string
        }
        return acc
      },
      {} as Record<string, string>
    )
  )

  const processedData = computed(() => {
    Object.keys(queries.value).forEach(property => {
      let path = property
      if (property in customPath) {
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
