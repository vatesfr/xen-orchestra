import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { XenApiVtpm } from '@vates/types'

export function createVtpmOperations(xenApi: XenApi) {
  return {
    async create(vmRef: XenApiVm['$ref']): Promise<XenApiVtpm['$ref']> {
      return xenApi.call('VTPM.create', [vmRef, false])
    },
    async delete(vtpmRef: XenApiVtpm['$ref']) {
      return xenApi.call('VTPM.destroy', [vtpmRef])
    },
  }
}
