import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoVmDisksSrs(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { useGetVdisByIds } = useXoVdiCollection()
  const { useGetSrsByIds } = useXoSrCollection()

  const { notCdDriveVbds } = useXoVmVbdsUtils(vm)

  const vdiIds = computed(() => notCdDriveVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : [])))

  const vdis = useGetVdisByIds(vdiIds)

  const srIds = computed(() => [...new Set(vdis.value.map(vdi => vdi.$SR))])

  const srs = useGetSrsByIds(srIds)

  return {
    vdis,
    srs,
  }
}
