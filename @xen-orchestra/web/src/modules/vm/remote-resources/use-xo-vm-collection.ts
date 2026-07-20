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
import { computed, ref, watch } from 'vue'

export type FrontXoVm = Pick<XoVm, (typeof vmFields)[number]>

export type VmGuestToolsEntry = { id: FrontXoVm['id']; name: string; version?: string }

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

function compareDriverVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [parts, build = '0'] = v.split('-')
    return [...parts.split('.').map(Number), Number(build)]
  }
  const aParsed = parse(a)
  const bParsed = parse(b)
  for (let i = 0; i < Math.max(aParsed.length, bParsed.length); i++) {
    const diff = (aParsed[i] ?? 0) - (bParsed[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

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

    const vmGuestToolsStatus = computed(() => {
      const missingVms: VmGuestToolsEntry[] = []
      const outOfDateVms: VmGuestToolsEntry[] = []
      const unknownVms: VmGuestToolsEntry[] = []
      let upToDate = 0
      const outOfDateVersions = new Map<string, number>()
      let bestVersion: string | undefined

      for (const vm of runningVms.value) {
        if (!vm.managementAgentDetected) {
          missingVms.push({ id: vm.id, name: vm.name_label })
        } else if (!vm.pvDriversDetected) {
          upToDate++
        } else if (vm.pvDriversUpToDate === false) {
          outOfDateVms.push({ id: vm.id, name: vm.name_label, version: vm.pvDriversVersion })
          const version = vm.pvDriversVersion ?? 'unknown'
          outOfDateVersions.set(version, (outOfDateVersions.get(version) ?? 0) + 1)
        } else if (vm.pvDriversUpToDate === undefined) {
          unknownVms.push({ id: vm.id, name: vm.name_label })
        } else {
          upToDate++
          if (vm.pvDriversVersion !== undefined) {
            if (bestVersion === undefined || compareDriverVersions(vm.pvDriversVersion, bestVersion) > 0) {
              bestVersion = vm.pvDriversVersion
            }
          }
        }
      }

      return {
        missingVms,
        outOfDateVms,
        unknownVms,
        upToDate,
        total: runningVms.value.length,
        outOfDateVersions,
        bestVersion,
      }
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
      vmGuestToolsStatus,
      runningVmsCountByPool,
      runningVmsCountByContainer,
      vmsByHost,
      vmsByPool,
      getVmHost,
      hostLessVmsByPool,
    }
  },
})
