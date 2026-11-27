import HostPatchesTable from '@/modules/host/components/HostPatchesTable.vue'
import type { MissingPatch } from '@/modules/host/remote-resources/use-xo-host-missing-patches-collection.ts'
import type { VueWrapper } from '@vue/test-utils'

// Two missing patches, each with its version
export const MISSING_PATCHES: MissingPatch[] = [
  { name: 'XSAPATCH-1', version: '1.0' },
  { name: 'XSAPATCH-2', version: '2.0' },
]

// The patches a card hands its `HostPatchesTable`
export function findTablePatches(wrapper: Pick<VueWrapper, 'getComponent'>) {
  return wrapper.getComponent(HostPatchesTable).props('patches')
}
