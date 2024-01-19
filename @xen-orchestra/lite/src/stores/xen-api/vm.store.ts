import type { GetStats } from '@/composables/fetch-stats.composable'
import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import { sortRecordsByNameLabel } from '@/libs/utils'
import type { VmStats } from '@/libs/xapi-stats'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { type VM_OPERATION, VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { useHostStore } from '@/stores/xen-api/host.store'
import { castArray } from 'lodash-es'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmStore = defineStore('xen-api-vm', () => {
  const context = useXenApiStoreSubscribableContext('vm')

  const records = computed(() =>
    context.records.value
      .filter(vm => !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain)
      .sort(sortRecordsByNameLabel)
  )

  const isOperationPending = (vm: XenApiVm, operations: VM_OPERATION[] | VM_OPERATION) => {
    const currentOperations = Object.values(vm.current_operations)

    return castArray(operations).some(operation => currentOperations.includes(operation))
  }

  const areSomeOperationAllowed = (vm: XenApiVm, operations: VM_OPERATION[] | VM_OPERATION) => {
    const allowedOperations = Object.values(vm.allowed_operations)

    return castArray(operations).some(operation => allowedOperations.includes(operation))
  }

  const runningVms = computed(() => records.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

  const recordsByHostRef = computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost['$ref'], XenApiVm[]>()

    records.value.forEach(vm => {
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

    const vm = context.getByUuid(id)

    if (vm === undefined) {
      throw new Error(`VM ${id} could not be found.`)
    }

    const hostStore = useHostStore()

    const host = hostStore.getByOpaqueRef(vm.resident_on)

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

  return {
    ...context,
    records,
    isOperationPending,
    areSomeOperationAllowed,
    runningVms,
    recordsByHostRef,
    getStats,
  }
})

export const useVmCollection = createUseCollection(useVmStore)
