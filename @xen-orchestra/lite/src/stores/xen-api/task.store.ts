import useArrayRemovedItemsHistory from '@/composables/array-removed-items-history.composable'
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import useFilteredCollection from '@/composables/filtered-collection.composable'
import useSortedCollection from '@/composables/sorted-collection.composable'
import type { XenApiTask } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useTaskStore = defineStore('xen-api-task', () => {
  const { context: baseContext, ...configRest } = createXapiStoreConfig('task')

  const { compareFn } = useCollectionSorter<XenApiTask>({
    initialSorts: ['-created'],
  })

  const { predicate } = useCollectionFilter({
    initialFilters: ['!name_label:|(SR.scan host.call_plugin)', 'status:pending'],
  })

  const sortedTasks = useSortedCollection(baseContext.records, compareFn)

  const pendingTasks = useFilteredCollection<XenApiTask>(sortedTasks, predicate)

  const finishedTasks = useArrayRemovedItemsHistory(sortedTasks, task => task.uuid, {
    limit: 50,
    onRemove: tasks =>
      tasks.map(task => ({
        ...task,
        finished: new Date().toISOString(),
      })),
  })

  const context = {
    ...baseContext,
    pendingTasks,
    finishedTasks: useSortedCollection(finishedTasks, compareFn),
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
