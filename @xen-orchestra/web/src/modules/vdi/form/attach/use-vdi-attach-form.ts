import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiUtils } from '@/modules/vdi/composables/xo-vdi-utils.composable.ts'
import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { required } from '@core/packages/form-validation'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { DOMAIN_TYPE, VBD_MODE } from '@vates/types'
import { computed, type MaybeRefOrGetter, reactive, toRefs, watch } from 'vue'
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

  const { useFormSelect, useSelect, validate, attachedVdiIds, selectedSr, srSelectBindings } = useVdiFormBase(
    vm,
    formData,
    {
      errors: {
        onSubmit: () => ({
          vdi: { required },
        }),
      },
    }
  )

  const { getVbdsByIds, useGetVbdsByIds } = useXoVbdCollection()
  const { useGetVdiById, useGetVdisByIds } = useXoVdiCollection()

  const availableVdis = useGetVdisByIds(() => (selectedSr.value?.VDIs ?? []) as FrontXoVdi['id'][])

  const selectedVdi = useGetVdiById(() => formData.vdi)

  const selectedVdiVbds = useGetVbdsByIds(() => selectedVdi.value?.$VBDs ?? [])

  const { isVdiFreeForWriting } = useXoVdiUtils(selectedVdiVbds)

  const vdiWarning = computed(() => {
    if (!formData.vdi) {
      return undefined
    }
    return attachedVdiIds.value.has(formData.vdi)
      ? { content: t('warning:vdi-already-attached'), accent: 'warning' }
      : undefined
  })

  watch(
    () => formData.sr,
    () => {
      formData.vdi = undefined
    }
  )

  const { id: vdiSelectId } = useFormSelect('vdi', availableVdis, {
    searchable: true,
    required: true,
    disabled: () => formData.sr === undefined,
    option: {
      label: 'name_label',
      value: 'id',
      properties: vdi => ({ icon: getVdiIcon(getVbdsByIds(vdi.$VBDs)) }),
    },
  })

  const { bootable } = toRefs(formData)

  const isPv = computed(() => vm.value.virtualizationMode === DOMAIN_TYPE.PV)

  const forceReadOnly = computed(() => selectedVdi.value !== undefined && !isVdiFreeForWriting.value)

  const readOnly = computed({
    get: () => formData.readOnly || forceReadOnly.value,
    set: value => {
      formData.readOnly = value
    },
  })

  async function validateAndBuildPayload(): Promise<NewVbdPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return {
      VM: vm.value.id,
      VDI: formData.vdi!,
      mode: readOnly.value ? VBD_MODE.RO : VBD_MODE.RW,
      ...(isPv.value && { bootable: formData.bootable }),
    }
  }

  return {
    selectedSr,
    srSelectBindings,
    vdiSelectBindings: useSelect(vdiSelectId, () => ({
      label: t('vdi'),
      ...(vdiWarning.value !== undefined && { warning: vdiWarning.value }),
    })),
    readOnly,
    forceReadOnly,
    bootable,
    isPv,
    validateAndBuildPayload,
  }
}
