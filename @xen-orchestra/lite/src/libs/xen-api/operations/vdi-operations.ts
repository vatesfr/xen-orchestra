import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiVdi } from '@/libs/xen-api/xen-api.types'
import { castArray } from 'lodash-es'

export function vdiOperations(xenApi: XenApi) {
  type VdiRefs = XenApiVdi['$ref'] | XenApiVdi['$ref'][]
  type VdiRecord = {
    name_label: string
    name_description: string
    SR: string | undefined
    virtual_size: number
    type?: string
    sharable?: boolean
    read_only?: boolean
    other_config?: Record<string, any>
    tags?: string[]
  }

  return {
    create: ({
      name_label,
      name_description,
      SR,
      virtual_size,
      type = 'user',
      sharable = false,
      read_only = false,
      other_config = {},
      tags = [],
    }: VdiRecord) => {
      const vdiRecord = {
        name_label,
        name_description,
        SR,
        virtual_size,
        type,
        sharable,
        read_only,
        other_config,
        tags,
      }
      return xenApi.call<XenApiVdi['$ref']>('VDI.create', [vdiRecord])
    },

    delete: (vdiRefs: VdiRefs) => Promise.all(castArray(vdiRefs).map(vdiRef => xenApi.call('VDI.destroy', [vdiRef]))),

    setNameDescription: (vdiRefs: VdiRefs, nameDescription: string) =>
      Promise.all(castArray(vdiRefs).map(vdiRef => xenApi.call('VDI.set_name_description', [vdiRef, nameDescription]))),

    setNameLabel: (vdiRefs: VdiRefs, nameLabel: string) =>
      Promise.all(castArray(vdiRefs).map(vdiRef => xenApi.call('VDI.set_name_label', [vdiRef, nameLabel]))),
  }
}
