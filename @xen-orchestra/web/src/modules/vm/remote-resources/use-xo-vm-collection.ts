import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { VM_POWER_STATE, type XoVm } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { ref, watch } from 'vue'

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
  'pvDriversUpToDate',
  'managementAgentDetected',
  'type',
  '$VBDs',
  'snapshots',
  'boot',
  'parent',
] as const satisfies readonly (keyof XoVm)[]

export const useXoVmCollection = defineRemoteResource({
  url: `${BASE_URL}/vms?fields=${vmFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'VM', fields: vmFields }),
  initialData: () => [] as FrontXoVm[],
  state: (rawVms, context) => {
    const { getHostById } = useXoHostCollection(context)

    const sortedVms = useSorted(rawVms, sortByNameLabel)

    const runningVms = ref<FrontXoVm[]>([])
    const vmsByHost = ref(new Map<FrontXoHost['id'], FrontXoVm[]>())
    const vmsByPool = ref(new Map<FrontXoPool['id'], FrontXoVm[]>())
    const hostLessVmsByPool = ref(new Map<FrontXoPool['id'], FrontXoVm[]>())
    const runningVmsCountByPool = ref(new Map<FrontXoPool['id'], number>())
    const runningVmsCountByContainer = ref(new Map<FrontXoHost['id'], number>())

    watch(sortedVms, vms => {
      const tmpRunningVms: FrontXoVm[] = []
      const tmpVmsByHost = new Map<FrontXoHost['id'], FrontXoVm[]>()
      const tmpVmsByPool = new Map<FrontXoPool['id'], FrontXoVm[]>()
      const tmpHostLessVmsByPool = new Map<FrontXoPool['id'], FrontXoVm[]>()
      const tmpRunningVmsCountByPool = new Map<FrontXoPool['id'], number>()
      const tmpRunningVmsCountByContainer = new Map<FrontXoHost['id'], number>()

      vms.forEach(vm => {
        if (vm.power_state === VM_POWER_STATE.RUNNING) {
          tmpRunningVms.push(vm)
          tmpRunningVmsCountByPool.set(vm.$pool, (tmpRunningVmsCountByPool.get(vm.$pool) ?? 0) + 1)
          const containerId = vm.$container as FrontXoHost['id']
          tmpRunningVmsCountByContainer.set(containerId, (tmpRunningVmsCountByContainer.get(containerId) ?? 0) + 1)
        }

        if (vm.$container !== vm.$pool) {
          const hostId = vm.$container as FrontXoHost['id']
          safePushInMap(tmpVmsByHost, hostId, vm)
        } else {
          safePushInMap(tmpHostLessVmsByPool, vm.$pool, vm)
        }

        safePushInMap(tmpVmsByPool, vm.$pool, vm)
      })

      runningVms.value = tmpRunningVms
      vmsByHost.value = tmpVmsByHost
      hostLessVmsByPool.value = tmpHostLessVmsByPool
      vmsByPool.value = tmpVmsByPool
      runningVmsCountByPool.value = tmpRunningVmsCountByPool
      runningVmsCountByContainer.value = tmpRunningVmsCountByContainer
    })

    function getVmHost(vm: FrontXoVm): FrontXoHost | undefined {
      const vmHostId = extractVmHostId(vm)

      if (vmHostId === undefined) {
        return undefined
      }

      return getHostById(vmHostId)
    }

    return {
      ...useXoCollectionState(sortedVms, {
        context,
        baseName: 'vm',
      }),
      runningVms,
      runningVmsCountByPool,
      runningVmsCountByContainer,
      vmsByHost,
      vmsByPool,
      getVmHost,
      hostLessVmsByPool,
    }
  },
})
