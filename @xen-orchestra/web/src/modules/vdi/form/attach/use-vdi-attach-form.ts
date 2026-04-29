import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, toRef, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdiAttachFormData = BaseVdiFormData & {
  vdi: FrontXoVdi['id'] | undefined
  readOnly: boolean
  bootable: boolean
}

export function useVdiAttachForm(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const formData = reactive<VdiAttachFormData>({
    sr: undefined,
    vdi: undefined,
    readOnly: false,
    bootable: false,
  })

  const { availableSrs, attachedVdiIds, getSrLocation, isFreeForWriting, selectedSr, srWarning, useSelect } =
    useVdiFormBase(vm, formData)

  const { useGetVdiById, useGetVdisByIds } = useXoVdiCollection()

  const availableVdis = useGetVdisByIds(() => (selectedSr.value?.VDIs ?? []) as FrontXoVdi['id'][])

  const selectedVdi = useGetVdiById(() => formData.vdi)

  const vdiWarning = computed(() => {
    if (!formData.vdi) {
      return undefined
    }
    return attachedVdiIds.value.has(formData.vdi) ? t('warning:vdi-already-attached') : undefined
  })

  watch(
    () => formData.sr,
    () => {
      formData.vdi = undefined
    }
  )

  const { id: srSelectId } = useFormSelect(availableSrs, {
    searchable: true,
    required: true,
    model: toRef(formData, 'sr'),
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
        return `${sr.name_label} (${getSrLocation(sr)}) - ${t('n-gb-left', { n: gbLeft })}`
      },
      value: 'id',
    },
  })

  const { id: vdiSelectId } = useFormSelect(availableVdis, {
    searchable: true,
    required: true,
    disabled: () => formData.sr === undefined,
    model: toRef(formData, 'vdi'),
    option: {
      label: 'name_label',
      value: 'id',
    },
  })

  const { readOnly, bootable } = toRefs(formData)

  const isPv = computed(() => vm.value.virtualizationMode === 'pv')

  function validateAndBuildPayload(): NewVbdPayload | undefined {
    if (!formData.vdi) {
      return undefined
    }

    const forceReadOnly = selectedVdi.value !== undefined && !isFreeForWriting(selectedVdi.value)

    return {
      VM: vm.value.id,
      VDI: formData.vdi,
      mode: formData.readOnly || forceReadOnly ? 'RO' : 'RW',
      ...(isPv.value && { bootable: formData.bootable }),
    }
  }

  const canSubmit = computed(() => formData.sr !== undefined && formData.vdi !== undefined)

  return {
    srSelectBindings: useSelect(srSelectId, () => ({
      label: t('storage-repository'),
      ...(srWarning.value !== undefined && { warning: srWarning.value }),
    })),
    vdiSelectBindings: useSelect(vdiSelectId, () => ({
      label: t('vdi'),
      ...(vdiWarning.value !== undefined && { warning: vdiWarning.value }),
    })),
    readOnly,
    bootable,
    isPv,
    canSubmit,
    validateAndBuildPayload,
  }
}
