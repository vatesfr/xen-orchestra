import { createSubscribe } from '@/stores/xen-api-new/create-subscribe'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNewVmStore = defineStore('vm-new', () => {
  const subscribe = createSubscribe('vm', context => ({
    runningVms: computed(() => context.records.value.filter(vm => vm.power_state === 'Running')),
  }))

  return {
    subscribe,
  }
})
