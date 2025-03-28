import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiVbd, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { VBD_MODE, VBD_TYPE } from '@vates/types/common'

export function createVbdOperations(xenApi: XenApi) {
  type VmRefs = MaybeArray<XenApiVm['$ref']>

  type VmRef = XenApiVm['$ref']

  type VbdRefs = MaybeArray<XenApiVbd['$ref']>

  type VdiRef = XenApiVdi['$ref']

  type VbdCreateParams = {
    vmRefs: VmRefs
    vdiRef: VdiRef
    userdevice?: string
    bootable?: boolean
    mode?: VBD_MODE
    type?: VBD_TYPE
    empty?: boolean
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  async function findUserDevice(device: string | undefined, vmRef: VmRef, type: VBD_TYPE) {
    if (device) {
      return device
    }

    const [allowedDevices] = await xenApi.vm.getAllowedVbdDevices(vmRef)

    if (allowedDevices.length === 0) {
      throw new Error('no allowed VBD devices')
    }

    if (type === VBD_TYPE.CD) {
      // Choose position 3 if allowed.
      return allowedDevices.includes('3') ? '3' : allowedDevices[0]
    } else {
      const device = allowedDevices.shift()

      // Avoid userdevice 3 if possible.
      if (device === '3' && allowedDevices.length > 1) {
        return allowedDevices[1]
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
        type = VBD_TYPE.DISK,
        mode = type === VBD_TYPE.DISK ? VBD_MODE.RW : VBD_MODE.RO,
        empty = false,
        other_config = {},
        qos_algorithm_params = {},
        qos_algorithm_type = '',
      } = params

      return Promise.all<XenApiVbd['$ref']>(
        toArray(vmRefs).map(async vmRef => {
          const userdevice = initialUserdevice ?? (await findUserDevice(initialUserdevice, vmRef, type))

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
