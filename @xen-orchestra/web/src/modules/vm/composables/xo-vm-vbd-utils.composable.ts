import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed } from 'vue'

export function useXoVmVbdsUtils(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { getVbdsByIds } = useXoVbdCollection()

  const notCdDriveVbds = computed(() => getVbdsByIds(vm.value.$VBDs).filter(vbd => !vbd.is_cd_drive))

  return {
    notCdDriveVbds,
  }
}
