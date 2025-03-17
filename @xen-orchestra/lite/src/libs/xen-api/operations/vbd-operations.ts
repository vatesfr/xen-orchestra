import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiVbd, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { castArray } from 'lodash-es'

export function vbdOperations(xenApi: XenApi) {
  type VmRefs = XenApiVm['$ref'] | XenApiVm['$ref'][]
  type VbdRefs = XenApiVbd['$ref'] | XenApiVbd['$ref'][]
  type VdiRef = XenApiVdi['$ref']
  type VbdCreateParams = {
    vmRefs: VmRefs
    vdiRef: VdiRef
    userdevice?: string | undefined
    bootable?: boolean
    mode?: string
    type?: string
    empty?: boolean
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  return {
    create: async ({
      vmRefs,
      vdiRef,
      userdevice,
      bootable = false,
      type = 'Disk',
      mode = type === 'Disk' ? 'RW' : 'RO',
      empty = false,
      other_config = {},
      qos_algorithm_params = {},
      qos_algorithm_type = '',
    }: VbdCreateParams) => {
      if (!userdevice) {
        const allowedDevices = await xenApi.vm.getAllowedVBDDevices(vmRefs)

        if (allowedDevices.length === 0) {
          throw new Error('no allowed VBD devices')
        }

        const allowedDevicesFlat = allowedDevices.flat()

        if (type === 'CD') {
          // Choose position 3 if allowed.
          userdevice = allowedDevicesFlat.includes('3') ? '3' : allowedDevicesFlat[0]
        } else {
          userdevice = allowedDevicesFlat.shift()

          // Avoid userdevice 3 if possible.
          if (userdevice === '3' && allowedDevices.length > 1) {
            userdevice = allowedDevicesFlat[1]
          }
        }
      }

      return Promise.all<XenApiVbd['$ref']>(
        castArray(vmRefs).map(vmRef => {
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

    delete: (vbdRefs: VbdRefs) => Promise.all(castArray(vbdRefs).map(vbdRef => xenApi.call('VBD.destroy', [vbdRef]))),

    insert: (vbdRefs: VbdRefs, vdiRef: VdiRef) =>
      Promise.all(castArray(vbdRefs).map(vbdRef => xenApi.call('VBD.insert', [vbdRef, vdiRef]))),

    setBootable: (vbdRefs: VbdRefs, bootable: boolean) =>
      Promise.all(castArray(vbdRefs).map(vbdRef => xenApi.call('VBD.set_bootable', [vbdRef, bootable]))),
  }
}
