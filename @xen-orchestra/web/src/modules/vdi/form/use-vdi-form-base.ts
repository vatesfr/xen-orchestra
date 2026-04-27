import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFormBindings } from '@core/packages/form-bindings'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type BaseVdiFormData = {
  sr: FrontXoSr['id'] | undefined
}

export function useVdiFormBase<T extends BaseVdiFormData>(rawVm: MaybeRefOrGetter<FrontXoVm>, formData: T) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const { srs, useGetSrById, useGetSrsByIds } = useXoSrCollection()
  const { useGetVdisByIds } = useXoVdiCollection()
  const { useGetVbdsByIds } = useXoVbdCollection()
  const { pbdsBySr } = useXoPbdCollection()
  const { useGetHostById } = useXoHostCollection()

  const isSrWritable = (sr: FrontXoSr) => sr.content_type !== 'iso' && sr.size > 0

  function getSrLocation(sr: FrontXoSr): string {
    if (sr.shared) {
      return t('shared')
    }

    const hostName = pbdsBySr.value
      .get(sr.id)
      ?.map(pbd => useGetHostById(pbd.host).value?.name_label)
      .find(name => name !== undefined)

    return hostName ?? t('unknown')
  }

  function isFreeForWriting(vdi: FrontXoVdi) {
    const vbds = useGetVbdsByIds(() => vdi.$VBDs).value
    return vbds.every(vbd => !vbd.attached || vbd.read_only)
  }

  const availableSrs = computed(() => srs.value.filter(sr => sr.$pool === vm.value.$pool && isSrWritable(sr)))

  const vmVbds = useGetVbdsByIds(() => vm.value.$VBDs)

  const attachedVdiIds = computed(
    () => new Set(vmVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : [])))
  )

  const vmVdiIds = computed(
    () => vmVbds.value.filter(vbd => !vbd.is_cd_drive && vbd.VDI).map(vbd => vbd.VDI) as FrontXoVdi['id'][]
  )

  const vmVdis = useGetVdisByIds(vmVdiIds)

  const vmVdiSrIds = computed(() => [...new Set(vmVdis.value.map(vdi => vdi.$SR))])

  const vmVdiSrs = useGetSrsByIds(vmVdiSrIds)

  const requiredHost = computed(() => {
    let host: FrontXoSr['$container'] | undefined

    for (const sr of vmVdiSrs.value) {
      if (sr.shared) {
        continue
      }

      if (host === undefined) {
        host = sr.$container
      } else if (host !== sr.$container) {
        return undefined
      }
    }

    return host
  })

  const selectedSr = useGetSrById(() => formData.sr)

  const srWarning = computed(() => {
    const sr = selectedSr.value

    if (!sr || sr.shared || requiredHost.value === undefined || sr.$container === requiredHost.value) {
      return undefined
    }

    return t('warning:vdi-sr')
  })

  const { useField, useSelect } = useFormBindings(formData)

  return {
    availableSrs,
    attachedVdiIds,
    getSrLocation,
    isFreeForWriting,
    requiredHost,
    selectedSr,
    srWarning,
    useField,
    useSelect,
  }
}
