import { useVmRawStore } from '@/stores/xen-api/vm-raw.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmTemplateStore = defineStore('xen-api-vm', () => {
  const deps = {
    vmRawStore: useVmRawStore(),
  }

  const vmRawContext = deps.vmRawStore.getContext()
  const records = computed(() =>
    vmRawContext.records.value.filter(vm => !vm.is_a_snapshot && !vm.is_control_domain && vm.is_a_template)
  )

  const context = {
    ...vmRawContext,
    records,
  }

  return createSubscribableStoreContext({ context }, deps)
})
