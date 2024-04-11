import { createXoStoreConfig, type RecordId, type Vm } from '@/stores/xo-rest-api/create-xo-store-config'
import { sortByNameLabel } from '@/utils/sort-by-name-label.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmStore = defineStore('vm', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('VM', {
    sortBy: sortByNameLabel,
  })

  const runningVms = computed(() => baseContext.records.value.filter(vm => vm.power_state === 'Running'))

  const vmsByHost = computed(() => {
    const vmsByHostMap = new Map<RecordId<'host'>, Vm[]>()

    runningVms.value.forEach(vm => {
      const hostId = vm.$container
      if (!vmsByHostMap.has(hostId)) {
        vmsByHostMap.set(hostId, [])
      }

      vmsByHostMap.get(hostId)?.push(vm)
    })

    return vmsByHostMap
  })

  const context = {
    ...baseContext,
    runningVms,
    vmsByHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
