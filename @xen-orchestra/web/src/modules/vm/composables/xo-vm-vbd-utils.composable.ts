import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoVmVbdsUtils(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { getVbdsByIds, areVbdsReady } = useXoVbdCollection()

  const vbds = computed(() => getVbdsByIds(vm.value.$VBDs))

  // the collection may be ready a moment before it has the VBDs of this VM
  const areVmVbdsReady = computed(() => areVbdsReady.value && vbds.value.length === vm.value.$VBDs.length)

  const cdDriveVbds = computed(() => vbds.value.filter(vbd => vbd.is_cd_drive))

  const notCdDriveVbds = computed(() => vbds.value.filter(vbd => !vbd.is_cd_drive))

  return {
    areVmVbdsReady,
    cdDriveVbds,
    notCdDriveVbds,
  }
}
