import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import type { NewVbdPayload } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVdiUtils } from '@/modules/vdi/composables/xo-vdi-utils.composable.ts'
import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import { type FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const BYTES_PER_GB = 1024 ** 3

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

  const { useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        sr: { required },
        vdi: { required },
      }),
    },
  })

  const { availableSrs, attachedVdiIds, getSrLocation, selectedSr, srWarning } = useVdiFormBase(vm, formData)

  const { pbdsBySr } = useXoPbdCollection()
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

  const { id: srSelectId } = useFormSelect('sr', availableSrs, {
    searchable: true,
    required: true,
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / BYTES_PER_GB)
        return `${sr.name_label} (${getSrLocation(sr)}) - ${t('n-gb-left', { n: gbLeft })}`
      },
      value: 'id',
      properties: sr => ({ icon: objectIcon('sr', getPbdsConnectionStatus(pbdsBySr.value.get(sr.id) ?? [])) }),
    },
  })

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

  const isPv = computed(() => vm.value.virtualizationMode === 'pv')

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
      mode: readOnly.value ? 'RO' : 'RW',
      ...(isPv.value && { bootable: formData.bootable }),
    }
  }

  return {
    selectedSr,
    srSelectBindings: useSelect(srSelectId, () => ({
      label: t('storage-repository'),
      ...(srWarning.value !== undefined && { warning: srWarning.value }),
    })),
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
