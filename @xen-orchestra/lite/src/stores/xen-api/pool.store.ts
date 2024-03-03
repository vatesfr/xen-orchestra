import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import type { XenApiPool } from '@/libs/xen-api/xen-api.types'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePoolStore = defineStore('xen-api-pool', () => {
  const context = useXenApiStoreSubscribableContext('pool')

  const pool = computed<XenApiPool | undefined>(() => context.records.value[0])

  return {
    ...context,
    pool,
  }
})

export const usePoolCollection = createUseCollection(usePoolStore)
