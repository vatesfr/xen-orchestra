import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useVdiVmVbd(
  rawVdi: MaybeRefOrGetter<FrontXoVdi | undefined>,
  rawVm: MaybeRefOrGetter<FrontXoVm | undefined>
) {
  const { useGetVbdsByIds } = useXoVbdCollection()

  const vbds = useGetVbdsByIds(() => toValue(rawVdi)?.$VBDs ?? [])

  return computed(() => vbds.value.find(vbd => vbd.VM === toValue(rawVm)?.id))
}
