import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useXenApiStore } from '@/stores/xen-api.store'
import type { XenApiPatch } from '@/types/xen-api'

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
