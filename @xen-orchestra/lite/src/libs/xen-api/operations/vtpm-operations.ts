import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'

export function createVtpmOperations(xenApi: XenApi) {
  return {
    async create(vmRef: XenApiVm['$ref']): Promise<string> {
      return xenApi.call('VTPM.create', [vmRef, false])
    },
  }
}
