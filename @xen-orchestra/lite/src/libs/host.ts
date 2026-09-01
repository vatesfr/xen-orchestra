import type { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import type { XenApiPatch } from '@/types/xen-api.ts'
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

export const isHostOperationPending = (host: XenApiHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
  const currentOperations = Object.values(host.current_operations)

  return castArray(operations).some(operation => currentOperations.includes(operation))
}
