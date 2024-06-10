import type { GetStats } from '@/composables/fetch-stats.composable'
import type { VmStats } from '@/libs/xapi-stats'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmStore = defineStore('xen-api-vm', () => {
  const deps = { host: useHostStore() }

  const { context: baseContext, ...configRest } = createXapiStoreConfig('vm', {
    beforeAdd(vm) {
      if (vm.is_a_snapshot || vm.is_control_domain || vm.is_a_template) {
        return undefined
      }

      return vm
    },
    sortBy: (vm1, vm2) => sortByNameLabel(vm1, vm2),
  })

  const runningVms = computed(() => baseContext.records.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

  const recordsByHostRef = computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost['$ref'], XenApiVm[]>()

    baseContext.records.value.forEach(vm => {
      if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
        vmsByHostOpaqueRef.set(vm.resident_on, [])
      }

      vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm)
    })

    return vmsByHostOpaqueRef
  })

  const getStats = ((id, granularity, ignoreExpired = false, { abortSignal }) => {
    const xenApiStore = useXenApiStore()

    if (!xenApiStore.isConnected) {
      return undefined
    }

    const vm = baseContext.getByUuid(id)

    if (vm === undefined) {
      throw new Error(`VM ${id} could not be found.`)
    }

    const host = deps.host.$context.getByOpaqueRef(vm.resident_on)

    if (host === undefined) {
      throw new Error(`VM ${id} is halted or host could not be found.`)
    }

    return xenApiStore.getXapiStats()._getAndUpdateStats<VmStats>({
      abortSignal,
      host,
      ignoreExpired,
      uuid: vm.uuid,
      granularity,
    })
  }) as GetStats<XenApiVm>

  const context = {
    ...baseContext,
    runningVms,
    recordsByHostRef,
    getStats,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
