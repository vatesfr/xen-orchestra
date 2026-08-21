import type { XenApiVbd } from '@/libs/xen-api/xen-api.types.ts'
import { useVbdStore } from '@/stores/xen-api/vbd.store.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export type VbdAttachmentStatus = 'allAttached' | 'someAttached' | 'noneAttached'

export function useVbdsStatus(vbdRefs: MaybeRefOrGetter<XenApiVbd['$ref'][]>): ComputedRef<VbdAttachmentStatus> {
  const { getByOpaqueRefs: getVbdsByOpaqueRefs } = useVbdStore().subscribe()

  return computed(() => {
    const vbds = getVbdsByOpaqueRefs(toValue(vbdRefs))

    if (vbds.length === 0) {
      return 'noneAttached'
    }

    const areAttached = vbds.map(vbd => vbd.currently_attached)

    if (areAttached.every(Boolean)) {
      return 'allAttached'
    }

    if (areAttached.some(Boolean)) {
      return 'someAttached'
    }

    return 'noneAttached'
  })
}
