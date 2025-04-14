import { useModal } from '@/composables/modal.composable'
import type XenApi from '@/libs/xen-api/xen-api'
import type { VM_COMPRESSION_TYPE } from '@/libs/xen-api/xen-api.enums'
import type { XenApiHost, XenApiSr, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export function createVmOperations(xenApi: XenApi) {
  type VmRefs = MaybeArray<XenApiVm['$ref']>

  type VmRefsWithPowerState = Record<XenApiVm['$ref'], XenApiVm['power_state']>

  type VmRefsWithNameLabel = Record<XenApiVm['$ref'], string>

  const setOtherConfig = (vmRefs: VmRefs, key: string, value: unknown) =>
    Promise.all(
      toArray(vmRefs).map(async vmRef => {
        await xenApi.call('VM.remove_from_other_config', [vmRef, key])
        if (value != null) {
          await xenApi.call('VM.add_to_other_config', [vmRef, key, typeof value === 'boolean' ? String(value) : value])
        }
      })
    )

  return {
    clone: (vmRefsToClone: VmRefsWithNameLabel) => {
      const vmRefs = Object.keys(vmRefsToClone) as XenApiVm['$ref'][]

      return Promise.all<XenApiVm['$ref']>(vmRefs.map(vmRef => xenApi.call('VM.clone', [vmRef, vmRefsToClone[vmRef]])))
    },

    copy: (vmRefsToCopy: VmRefsWithNameLabel, srRef?: XenApiSr['$ref']) => {
      const vmRefs = Object.keys(vmRefsToCopy) as XenApiVm['$ref'][]

      return Promise.all<XenApiVm['$ref']>(
        vmRefs.map(vmRef => xenApi.call('VM.copy', [vmRef, vmRefsToCopy[vmRef], srRef ?? '']))
      )
    },

    delete: (vmRefs: VmRefs) => Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.destroy', [vmRef]))),

    export: (vmRefs: VmRefs, compression: VM_COMPRESSION_TYPE) => {
      const blockedUrls: URL[] = []

      toArray(vmRefs).forEach(vmRef => {
        const url = new URL(xenApi.hostUrl)
        url.pathname = '/export/'
        url.search = new URLSearchParams({
          session_id: xenApi.sessionId!,
          ref: vmRef,
          use_compression: compression,
        }).toString()

        const _window = window.open(url.href, '_blank')
        if (_window === null) {
          blockedUrls.push(url)
        } else {
          URL.revokeObjectURL(url.toString())
        }
      })

      if (blockedUrls.length > 0) {
        const { onClose } = useModal(() => import('@/components/modals/VmExportBlockedUrlsModal.vue'), {
          blockedUrls,
        })
        onClose(() => blockedUrls.forEach(url => URL.revokeObjectURL(url.toString())))
      }
    },

    getAllowedVbdDevices: (vmRefs: VmRefs): Promise<string[][]> =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call<string[]>('VM.get_allowed_VBD_devices', [vmRef]))),

    getAllowedVifDevices: (vmRefs: VmRefs): Promise<string[][]> =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call<string[]>('VM.get_allowed_VIF_devices', [vmRef]))),

    migrate: (vmRefs: VmRefs, destinationHostRef: XenApiHost['$ref']) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.pool_migrate', [vmRef, destinationHostRef, { force: 'false' }]))
      ),

    pause: (vmRefs: VmRefs) => Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.pause', [vmRef]))),

    provision: (vmRefs: VmRefs) => Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.provision', [vmRef]))),

    reboot: (vmRefs: VmRefs, force = false) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call(`VM.${force ? 'hard' : 'clean'}_reboot`, [vmRef]))),

    removeFromOtherConfig: (vmRefs: VmRefs, key: string) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.remove_from_other_config', [vmRef, key]))),

    resume: (vmRefsWithPowerState: VmRefsWithPowerState) => {
      const vmRefs = Object.keys(vmRefsWithPowerState) as XenApiVm['$ref'][]
      return Promise.all(
        vmRefs.map(vmRef => {
          if (vmRefsWithPowerState[vmRef] === 'Suspended') {
            return xenApi.call('VM.resume', [vmRef, false, false])
          }
          return xenApi.call('VM.unpause', [vmRef])
        })
      )
    },

    setAffinityHost: (vmRefs: XenApiVm['$ref'], hostRef: XenApiHost['$ref'] | null) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_affinity', [vmRef, hostRef ?? '']))),

    setAutoPowerOn: (vmRef: XenApiVm['$ref'], value: boolean) => setOtherConfig(vmRef, 'auto_poweron', value),

    setCpuMask: (vmRefs: VmRefs, mask: string[] | null) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_params', [vmRef, 'mask', mask?.join(',') ?? '']))
      ),

    setCpuWeight: (vmRefs: VmRefs, weight: number | null) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_params', [vmRef, 'weight', weight?.toString() ?? '']))
      ),

    setCopyBiosString: (vmRefs: VmRefs, hostRef: XenApiHost['$ref']) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_copy_bios_string', [vmRef, hostRef]))),

    setHvmBootFirmware: async (vmRef: XenApiVm['$ref'], firmware: string) => {
      await Promise.all([
        xenApi.call('VM.remove_from_HVM_boot_params', [vmRef, 'firmware']),
        xenApi.call('VM.remove_from_platform', [vmRef, 'device-model']),
      ])
      await Promise.all([
        xenApi.call('VM.add_to_HVM_boot_params', [vmRef, 'firmware', firmware]),
        xenApi.call('VM.add_to_platform', [
          vmRef,
          'device-model',
          'qemu-upstream-' + (firmware === 'uefi' ? 'uefi' : 'compact'),
        ]),
      ])
    },

    setMemory: (vmRefs: VmRefs, count: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_memory', [vmRef, count]))),

    setMemoryDynamicMax: (vmRefs: VmRefs, max: number) =>
      Promise.all(
        toArray(vmRefs).map(vmRef =>
          xenApi.call('VM.set_memory_limits', [vmRef, 'memory_static_min', String(max), String(max), String(max)])
        )
      ),

    setMemoryDynamicMin: (vmRefs: VmRefs, dynamicMin: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_memory_dynamic_min', [vmRef, String(dynamicMin)]))),

    setMemoryDynamicRange: (vmRefs: VmRefs, dynamicMin: number, dynamicMax: number) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.set_memory_dynamic_range', [vmRef, dynamicMin, dynamicMax]))
      ),

    setMemoryMin: (vmRefs: XenApiVm['$ref'], memoryDynamicMin: number) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.set_memory_dynamic_min', [vmRef, String(memoryDynamicMin)]))
      ),

    setMemoryStaticMax: (vmRefs: VmRefs, staticMax: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_memory_static_max', [vmRef, String(staticMax)]))),

    setNameDescription: (vmRefs: VmRefs, nameDescription: string) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_name_description', [vmRef, nameDescription]))),

    setNameLabel: (vmRefs: VmRefs, nameLabel: string) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_name_label', [vmRef, nameLabel]))),

    setVCpuCap: (vmRefs: VmRefs, cap: number | null) =>
      Promise.all(
        toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_params', [vmRef, 'cap', cap?.toString() ?? '']))
      ),

    setVCPUsAtStartup: (vmRefs: VmRefs, count: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_at_startup', [vmRef, count]))),

    setVCPUsMax: (vmRefs: VmRefs, max: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_max', [vmRef, String(max)]))),

    setVCPUsNumberLive: (vmRefs: VmRefs, count: number) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.set_VCPUs_number_live', [vmRef, String(count)]))),

    setVirtualizationMode: (vmRefs: XenApiVm['$ref'], virtualizationMode: 'pv' | 'hvm') => {
      if (virtualizationMode !== 'pv' && virtualizationMode !== 'hvm') {
        return Promise.reject(new Error(`The virtualization mode must be 'pv' or 'hvm'`))
      }
      return Promise.all(
        toArray(vmRefs).map(vmRef =>
          xenApi.call(virtualizationMode === 'hvm' ? 'VM.set_HVM_boot_policy' : 'VM.set_domain_type', [
            vmRef,
            virtualizationMode === 'hvm' ? 'Boot order' : '',
          ])
        )
      )
    },

    shutdown: (vmRefs: VmRefs, force = false) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call(`VM.${force ? 'hard' : 'clean'}_shutdown`, [vmRef]))),

    start: (vmRefs: VmRefs) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.start', [vmRef, false, false]))),

    startOn: (vmRefs: VmRefs, hostRef: XenApiHost['$ref']) =>
      Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.start_on', [vmRef, hostRef, false, false]))),

    suspend: (vmRefs: VmRefs) => Promise.all(toArray(vmRefs).map(vmRef => xenApi.call('VM.suspend', [vmRef]))),

    snapshot: (vmRefsToSnapshot: VmRefsWithNameLabel) => {
      const vmRefs = Object.keys(vmRefsToSnapshot) as XenApiVm['$ref'][]
      return Promise.all(vmRefs.map(vmRef => xenApi.call('VM.snapshot', [vmRef, vmRefsToSnapshot[vmRef]])))
    },
  }
}
