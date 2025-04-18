import type { GetStats } from '@/composables/fetch-stats.composable'
import type { VmStats } from '@/libs/xapi-stats'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { usePbdStore } from '@/stores/xen-api/pbd.store.ts'
import { useSrStore } from '@/stores/xen-api/sr.store.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { useVdiStore } from '@/stores/xen-api/vdi.store.ts'
import { useVmRawStore } from '@/stores/xen-api/vm-raw.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useVmStore = defineStore('xen-api-vm', () => {
  const deps = {
    hostStore: useHostStore(),
    vmRawStore: useVmRawStore(),
    vbdStore: useVbdStore(),
    vdiStore: useVdiStore(),
    srStore: useSrStore(),
    pbdStore: usePbdStore(),
  }

  const xenApiStore = useXenApiStore()

  const hostContext = deps.hostStore.getContext()

  const vmRawContext = deps.vmRawStore.getContext()

  const vbdContext = deps.vbdStore.getContext()

  const vdiContext = deps.vdiStore.getContext()

  const srContext = deps.srStore.getContext()

  const pbdContext = deps.pbdStore.getContext()

  const records = computed(() =>
    vmRawContext.records.value.filter(vm => !vm.is_a_snapshot && !vm.is_control_domain && !vm.is_a_template)
  )

  const templates = computed(() =>
    vmRawContext.records.value.filter(vm => !vm.is_a_snapshot && !vm.is_control_domain && vm.is_a_template)
  )

  const runningVms = computed(() => records.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

  const recordsByHostRef = computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost['$ref'], XenApiVm[]>()

    records.value.forEach(vm => {
      // Get all VBDs for this VM
      const vmVbds = vbdContext.records.value.filter(vbd => vbd.VM === vm.$ref)

      // Find a local SR through VBDs, SR and PBD
      const hasLocalSr = vmVbds.some(vbd => {
        const vdi = vdiContext.getByOpaqueRef(vbd.VDI)
        if (vdi === undefined) {
          return false
        }

        const sr = srContext.getByOpaqueRef(vdi.SR)
        if (sr === undefined || sr.shared) {
          return false
        }

        const pbd = pbdContext.getByOpaqueRef(sr.PBDs[0])
        if (pbd === undefined) {
          return false
        }

        const hostRef = pbd.host
        if (hostRef === undefined) {
          return false
        }

        if (!vmsByHostOpaqueRef.has(hostRef)) {
          vmsByHostOpaqueRef.set(hostRef, [])
        }

        vmsByHostOpaqueRef.get(hostRef)?.push(vm)

        return true
      })

      if (!hasLocalSr && vm.resident_on) {
        if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
          vmsByHostOpaqueRef.set(vm.resident_on, [])
        }

        vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm)
      }
    })

    return vmsByHostOpaqueRef
  })

  const getStats = ((id, granularity, ignoreExpired = false, { abortSignal }) => {
    if (!xenApiStore.isConnected) {
      return undefined
    }

    const vm = vmRawContext.getByUuid(id)

    if (vm === undefined) {
      throw new Error(`VM ${id} could not be found.`)
    }

    const host = hostContext.getByOpaqueRef(vm.resident_on)

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
    ...vmRawContext,
    records,
    templates,
    runningVms,
    recordsByHostRef,
    getStats,
  }

  return createSubscribableStoreContext({ context }, deps)
})
