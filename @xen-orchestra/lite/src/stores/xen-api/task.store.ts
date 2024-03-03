import useArrayRemovedItemsHistory from '@/composables/array-removed-items-history.composable'
import useCollectionFilter from '@/composables/collection-filter.composable'
import useCollectionSorter from '@/composables/collection-sorter.composable'
import useFilteredCollection from '@/composables/filtered-collection.composable'
import useSortedCollection from '@/composables/sorted-collection.composable'
import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import type { XenApiTask } from '@/libs/xen-api/xen-api.types'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useTaskStore = defineStore('xen-api-task', () => {
  const context = useXenApiStoreSubscribableContext('task')

  const { compareFn } = useCollectionSorter<XenApiTask>({
    initialSorts: ['-created'],
  })

  const { predicate } = useCollectionFilter({
    initialFilters: ['!name_label:|(SR.scan host.call_plugin)', 'status:pending'],
  })

  const sortedTasks = useSortedCollection(context.records, compareFn)

  const pendingTasks = useFilteredCollection<XenApiTask>(sortedTasks, predicate)

  const finishedTasks = useArrayRemovedItemsHistory(sortedTasks, task => task.uuid, {
    limit: 50,
    onRemove: tasks =>
      tasks.map(task => ({
        ...task,
        finished: new Date().toISOString(),
      })),
  })

  return {
    ...context,
    pendingTasks,
    finishedTasks: useSortedCollection(finishedTasks, compareFn),
  }
})

export const useTaskCollection = createUseCollection(useTaskStore)
