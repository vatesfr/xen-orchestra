import { useVmRawStore } from '@/stores/xen-api/vm-raw.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useControlDomainStore = defineStore('xen-api-control-domain', () => {
  const deps = {
    vmRawStore: useVmRawStore(),
  }

  const vmRawContext = deps.vmRawStore.getContext()

  const records = computed(() => vmRawContext.records.value.filter(vm => vm.is_control_domain))

  const context = {
    ...vmRawContext,
    records,
  }

  return createSubscribableStoreContext({ context }, deps)
})
