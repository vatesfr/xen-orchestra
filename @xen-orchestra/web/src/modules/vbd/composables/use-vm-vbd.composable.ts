import { useXoVbdCollection, type FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useVmVbd(vbdIds: MaybeRefOrGetter<FrontXoVbd['id'][]>, vm: MaybeRefOrGetter<FrontXoVm | undefined>) {
  const { getVbdsByIds } = useXoVbdCollection()

  return computed(() => {
    const vmId = toValue(vm)?.id

    if (vmId === undefined) {
      return undefined
    }

    return getVbdsByIds(toValue(vbdIds)).find(vbd => vbd.VM === vmId)
  })
}
