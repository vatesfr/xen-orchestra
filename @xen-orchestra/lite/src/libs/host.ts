import { useXenApiStore } from '@/stores/xen-api.store'
import type { XenApiPatch } from '@/types/xen-api'
import type { HOST_ALLOWED_OPERATIONS, XenApiHost } from '@vates/types'
import { castArray } from 'lodash-es'

export async function fetchMissingHostPatches(hostRef: XenApiHost['$ref']): Promise<XenApiPatch[]> {
  const xenApiStore = useXenApiStore()

  const rawPatchesAsString = await xenApiStore
    .getXapi()
    .call<string>('host.call_plugin', [hostRef, 'updater.py', 'check_update', {}])

  const rawPatches = JSON.parse(rawPatchesAsString) as Omit<XenApiPatch, '$id'>[]

  return rawPatches.map(rawPatch => ({
    ...rawPatch,
    $id: `${rawPatch.name}-${rawPatch.version}`,
  }))
}

export const isHostOperationPending = (
  host: XenApiHost,
  operations: HOST_ALLOWED_OPERATIONS[] | HOST_ALLOWED_OPERATIONS
) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
