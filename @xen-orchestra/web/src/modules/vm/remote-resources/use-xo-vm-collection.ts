import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { VM_POWER_STATE, type XoHost, type XoPool, type XoVm } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export type FrontXoVm = Pick<XoVm, (typeof vmFields)[number]>

const vmFields = [
  'id',
  'name_label',
  'name_description',
  'power_state',
  '$container',
  '$pool',
  'other',
  'current_operations',
  'creation',
  'CPUs',
  'addresses',
  'tags',
  'os_version',
  'virtualizationMode',
  'secureBoot',
  'VTPMs',
  'VIFs',
  'viridian',
  'isNestedVirtEnabled',
  'memory',
  'VGPUs',
  'high_availability',
  'auto_poweron',
  'startDelay',
  'vga',
  'videoram',
  'pvDriversVersion',
  'cpuWeight',
  'cpuCap',
  'cpuMask',
  'coresPerSocket',
  'mainIpAddress',
  'nicType',
  'affinityHost',
  'suspendSr',
  'blockedOperations',
  'hasVendorDevice',
  'startTime',
  'installTime',
  'pvDriversDetected',
  'managementAgentDetected',
  'type',
  '$VBDs',
  'snapshots',
  'boot',
] as const satisfies readonly (keyof XoVm)[]

export const useXoVmCollection = defineRemoteResource({
  url: `${BASE_URL}/vms?fields=${vmFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'VM', fields: vmFields }),
  initialData: () => [] as FrontXoVm[],
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
      }, new Map<XoPool['id'], FrontXoVm[]>())
    })

    function getVmHost(vm: FrontXoVm): FrontXoHost | undefined {
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

function createVmsByHostMap<THostLess extends boolean>(vms: FrontXoVm[], hostLess: THostLess) {
  const vmsMap = new Map<THostLess extends true ? XoPool['id'] : XoHost['id'], FrontXoVm[]>()

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

function extractVmHostId(vm: FrontXoVm) {
  return vm.$container === vm.$pool ? undefined : (vm.$container as FrontXoHost['id'])
}
