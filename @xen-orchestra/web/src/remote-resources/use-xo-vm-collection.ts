import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import { VM_POWER_STATE, type XoVm } from '@/types/xo/vm.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoVmCollection = defineRemoteResource({
  url: '/rest/v0/vms?fields=id,name_label,name_description,power_state,$container,$pool,other,current_operations,CPUs,addresses,tags,os_version,virtualizationMode,secureBoot,VTPMs,viridian,isNestedVirtEnabled,memory,VGPUs,high_availability,auto_poweron,startDelay,vga,videoram,pvDriversVersion,cpuWeight,cpuCap,cpuMask,coresPerSocket,mainIpAddress,nicType,affinityHost,suspendSr,blockedOperations,hasVendorDevice,startTime,installTime,pvDriversDetected',
  initialData: () => [] as XoVm[],
  state: (rawVms, context) => {
    const { getHostById } = useXoHostCollection(context)

    const vms = useSorted(rawVms, sortByNameLabel)

    const runningVms = computed(() => vms.value.filter(vm => vm.power_state === VM_POWER_STATE.RUNNING))

    const vmsByHost = computed(() => createVmsByHostMap(vms.value, false))

    const hostLessVmsByPool = computed(() => createVmsByHostMap(vms.value, true))

    const vmsByPool = computed(() => {
      return vms.value.reduce((acc, vm) => {
        if (!acc.has(vm.$pool)) {
          acc.set(vm.$pool, [])
        }

        acc.get(vm.$pool)!.push(vm)

        return acc
      }, new Map<XoPool['id'], XoVm[]>())
    })

    function getVmHost(vm: XoVm): XoHost | undefined {
      const vmHostId = extractVmHostId(vm)

      if (vmHostId === undefined) {
        return undefined
      }

      return getHostById(vmHostId)
    }

    return {
      ...useXoCollectionState(vms, {
        context,
        baseName: 'vm',
      }),
      runningVms,
      vmsByHost,
      vmsByPool,
      getVmHost,
      hostLessVmsByPool,
    }
  },
})

function createVmsByHostMap<THostLess extends boolean>(vms: XoVm[], hostLess: THostLess) {
  const vmsMap = new Map<THostLess extends true ? XoPool['id'] : XoHost['id'], XoVm[]>()

  vms.forEach(vm => {
    const hasHost = vm.$container !== vm.$pool

    if (hasHost && hostLess) {
      return
    }

    const id = vm.$container as THostLess extends true ? XoPool['id'] : XoHost['id']

    if (!vmsMap.has(id)) {
      vmsMap.set(id, [])
    }

    vmsMap.get(id)!.push(vm)
  })

  return vmsMap
}

function extractVmHostId(vm: XoVm) {
  return vm.$container === vm.$pool ? undefined : (vm.$container as XoHost['id'])
}
