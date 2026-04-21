import { type FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export type VbdAttachmentStatus = 'allAttached' | 'someAttached' | 'noneAttached'

export function useVbdsStatus(vbdIds: MaybeRefOrGetter<FrontXoVbd['id'][]>): ComputedRef<VbdAttachmentStatus> {
  const { getVbdsByIds } = useXoVbdCollection()

  return computed(() => {
    const vbds = getVbdsByIds(toValue(vbdIds))

    if (vbds.length === 0) {
      return 'noneAttached'
    }

    const areAttached = vbds.map(vbd => vbd.attached)

    if (areAttached.every(Boolean)) {
      return 'allAttached'
    }

    if (areAttached.some(Boolean)) {
      return 'someAttached'
    }

    return 'noneAttached'
  })
}
