import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'
import { getVdiFormat } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useVdiConfiguration(
  rawVdi: MaybeRefOrGetter<FrontXoVdi | FrontXoVdiSnapshot | undefined>,
  rawVbd: MaybeRefOrGetter<FrontXoVbd | undefined>
) {
  const vdi = toComputed(rawVdi)
  const vbd = toComputed(rawVbd)

  const { useGetSrById } = useXoSrCollection()
  const { useGetVbdsByIds } = useXoVbdCollection()
  const { useGetVmsByIds } = useXoVmCollection()

  const sr = useGetSrById(() => vdi.value?.$SR)

  const vbds = useGetVbdsByIds(() => vdi.value?.$VBDs ?? [])

  const vms = useGetVmsByIds(() => vbds.value.map(vbd => vbd.VM as FrontXoVm['id']))

  const vmNames = computed(() => vms.value.map(vm => vm.name_label).join(', '))

  const format = computed(() => getVdiFormat(vdi.value?.image_format))

  const isReadOnly = computed(() => vbd.value?.read_only ?? false)

  const isBootable = computed(() => vbd.value?.bootable ?? false)

  const isCbtEnabled = computed(() => vdi.value?.cbt_enabled ?? false)

  const isSnapshottingEnabled = computed(() => (vdi.value ? !vdi.value.tags.includes('NOSNAP') : false))

  return { sr, vms, vmNames, format, isReadOnly, isBootable, isCbtEnabled, isSnapshottingEnabled }
}
