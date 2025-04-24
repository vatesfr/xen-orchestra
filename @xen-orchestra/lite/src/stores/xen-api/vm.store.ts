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

  // Helper function to find a host with local SR for a VM
  const findHostWithLocalSr = (vm: XenApiVm) => {
    const vmVbds = vbdContext.records.value.filter(vbd => vbd.VM === vm.$ref)

    for (const vbd of vmVbds) {
      const vdi = vdiContext.getByOpaqueRef(vbd.VDI)
      if (vdi === undefined) {
        continue
      }

      const sr = srContext.getByOpaqueRef(vdi.SR)
      if (sr === undefined || sr.shared) {
        continue
      }

      const pbd = pbdContext.getByOpaqueRef(sr.PBDs[0])
      if (pbd === undefined || pbd.host === undefined) {
        continue
      }

      return pbd.host
    }

    return undefined
  }

  const recordsByHostRef = computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost['$ref'], XenApiVm[]>()

    const addToVmByHostMap = (hostRef: XenApiHost['$ref'], vm: XenApiVm) => {
      if (!vmsByHostOpaqueRef.has(hostRef)) {
        vmsByHostOpaqueRef.set(hostRef, [])
      }
      vmsByHostOpaqueRef.get(hostRef)?.push(vm)
    }
    records.value.forEach(vm => {
      // First try to find a host with local SR
      const hostWithLocalSr = findHostWithLocalSr(vm)

      if (hostWithLocalSr !== undefined) {
        // If found, add VM to that host
        addToVmByHostMap(hostWithLocalSr, vm)
      } else if (vm.resident_on) {
        // Otherwise, if VM is running on a host, add it there
        addToVmByHostMap(vm.resident_on, vm)
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

  const getVmHost = (vm: XenApiVm): XenApiHost | undefined => {
    // VM is RUNNING
    if (vm.resident_on !== 'OpaqueRef:NULL') {
      return hostContext.getByOpaqueRef(vm.resident_on)
    }

    // VM is HALTED
    const vmVbds = vbdContext.records.value.filter(vbd => vbd.VM === vm.$ref)

    for (const vbd of vmVbds) {
      const vdi = vdiContext.getByOpaqueRef(vbd.VDI)

      if (vdi === undefined) {
        continue
      }

      const sr = srContext.getByOpaqueRef(vdi.SR)

      if (sr === undefined || sr.shared) {
        continue
      }

      const pbd = pbdContext.getByOpaqueRef(sr.PBDs[0])

      if (pbd?.host === undefined) {
        continue
      }

      return hostContext.getByOpaqueRef(pbd.host)
    }

    return vm.resident_on ? hostContext.getByOpaqueRef(vm.resident_on) : undefined
  }

  const context = {
    ...vmRawContext,
    records,
    templates,
    runningVms,
    recordsByHostRef,
    getStats,
    getVmHost,
  }

  return createSubscribableStoreContext({ context }, deps)
})
