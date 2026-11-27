import { useRouteQuery } from '@core/composables/route-query.composable.ts'

export function useUnselectAfterDelete() {
  const selectedId = useRouteQuery('id')

  function unselectIfDeleted(deletedIds: string[], results: PromiseSettledResult<unknown>[]) {
    const isSelectedDeleted = results.some(
      (result, index) => result.status === 'fulfilled' && deletedIds[index] === selectedId.value
    )

    if (isSelectedDeleted) {
      selectedId.value = ''
    }
  }

  return { unselectIfDeleted }
}
