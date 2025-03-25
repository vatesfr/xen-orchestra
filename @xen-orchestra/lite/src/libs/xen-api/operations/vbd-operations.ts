import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiVbd, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import type { VBD_MODE, VBD_TYPE } from '@vates/types/common'

export function createVbdOperations(xenApi: XenApi) {
  type VmRefs = MaybeArray<XenApiVm['$ref']>

  type VbdRefs = MaybeArray<XenApiVbd['$ref']>

  type VdiRef = XenApiVdi['$ref']

  type VbdCreateParams = {
    vmRefs: VmRefs
    vdiRef: VdiRef
    userdevice?: string | undefined
    bootable?: boolean
    mode?: VBD_MODE
    type?: VBD_TYPE
    empty?: boolean
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  async function findUserDevice(device: string | undefined, vmRefs: VmRefs, type: string) {
    if (device) {
      return device
    }

    const allowedDevices = await xenApi.vm.getAllowedVbdDevices(vmRefs)

    if (allowedDevices.length === 0) {
      throw new Error('no allowed VBD devices')
    }

    const allowedDevicesFlat = allowedDevices.flat()

    if (type === 'CD') {
      // Choose position 3 if allowed.
      return allowedDevicesFlat.includes('3') ? '3' : allowedDevicesFlat[0]
    } else {
      const device = allowedDevicesFlat.shift()

      // Avoid userdevice 3 if possible.
      if (device === '3' && allowedDevices.length > 1) {
        return allowedDevicesFlat[1]
      }

      return device
    }
  }

  return {
    create: async (params: VbdCreateParams) => {
      const {
        vmRefs,
        vdiRef,
        userdevice: initialUserdevice,
        bootable = false,
        type = 'Disk',
        mode = type === 'Disk' ? 'RW' : 'RO',
        empty = false,
        other_config = {},
        qos_algorithm_params = {},
        qos_algorithm_type = '',
      } = params

      const userdevice = initialUserdevice ?? (await findUserDevice(initialUserdevice, vmRefs, type))

      return Promise.all<XenApiVbd['$ref']>(
        toArray(vmRefs).map(vmRef => {
          const vbdRecord = {
            VM: vmRef,
            VDI: vdiRef,
            userdevice,
            bootable,
            mode,
            type,
            empty,
            other_config,
            qos_algorithm_params,
            qos_algorithm_type,
          }

          return xenApi.call('VBD.create', [vbdRecord])
        })
      )
    },

    delete: (vbdRefs: VbdRefs) => Promise.all(toArray(vbdRefs).map(vbdRef => xenApi.call('VBD.destroy', [vbdRef]))),

    insert: (vbdRefs: VbdRefs, vdiRef: VdiRef) =>
      Promise.all(toArray(vbdRefs).map(vbdRef => xenApi.call('VBD.insert', [vbdRef, vdiRef]))),

    setBootable: (vbdRefs: VbdRefs, bootable: boolean) =>
      Promise.all(toArray(vbdRefs).map(vbdRef => xenApi.call('VBD.set_bootable', [vbdRef, bootable]))),
  }
}
