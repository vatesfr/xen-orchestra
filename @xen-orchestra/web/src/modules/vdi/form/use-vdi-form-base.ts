import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { useValidatedForm } from '@core/packages/validated-form'
import { objectIcon } from '@core/icons'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type BaseVdiFormData = {
  sr: FrontXoSr['id'] | undefined
}

type VdiFormSelectHelpers<T extends BaseVdiFormData & Record<string, unknown>> = Pick<
  ReturnType<typeof useValidatedForm<T>>,
  'useFormSelect' | 'useSelect'
>

export function useVdiFormBase<T extends BaseVdiFormData & Record<string, unknown>>(
  rawVm: MaybeRefOrGetter<FrontXoVm>,
  formData: T,
  { useFormSelect, useSelect }: VdiFormSelectHelpers<T>
) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const { srs, useGetSrById, useGetSrsByIds } = useXoSrCollection()
  const { useGetVdisByIds } = useXoVdiCollection()
  const { useGetVbdsByIds } = useXoVbdCollection()

  const { getSrLocation } = useXoSrUtils()

  const { notCdDriveVbds } = useXoVmVbdsUtils(vm)

  const availableSrs = computed(() => srs.value.filter(sr => sr.$pool === vm.value.$pool && isSrWritable(sr)))

  const vmVbds = useGetVbdsByIds(() => vm.value.$VBDs)

  const attachedVdiIds = computed(
    () => new Set(vmVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : [])))
  )

  const vmVdiIds = computed(() => notCdDriveVbds.value.flatMap(vbd => (vbd.VDI ? [vbd.VDI as FrontXoVdi['id']] : [])))

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

  const srWarning = computed<InputWrapperMessage | undefined>(() => {
    const sr = selectedSr.value

    if (!sr || sr.shared || requiredHost.value === undefined || sr.$container === requiredHost.value) {
      return undefined
    }

    return { content: t('warning:vdi-sr'), accent: 'warning' }
  })

  const { pbdsBySr } = useXoPbdCollection()

  const { id: srSelectId } = useFormSelect('sr', availableSrs, {
    searchable: true,
    required: true,
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / ONE_GB)
        return `${sr.name_label} (${getSrLocation(sr)}) - ${t('n-gb-left', { n: gbLeft })}`
      },
      value: 'id',
      properties: sr => ({ icon: objectIcon('sr', getPbdsConnectionStatus(pbdsBySr.value.get(sr.id) ?? [])) }),
    },
  })

  const srSelectBindings = useSelect(srSelectId, () => ({
    label: t('storage-repository'),
    ...(srWarning.value !== undefined && { warning: srWarning.value }),
  }))

  return {
    attachedVdiIds,
    selectedSr,
    srSelectBindings,
  }
}
