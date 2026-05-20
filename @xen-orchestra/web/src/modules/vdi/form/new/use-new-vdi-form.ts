import { getPbdsConnectionStatus } from '@/modules/pbd/composables/xo-pbd-utils.composable.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import type { NewVdiPayload, VdiSource } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { minValue, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const BYTES_PER_GB = 1024 ** 3

type NewVdiFormData = BaseVdiFormData & {
  source: VdiSource
  name_label: string
  name_description: string
  // GB, in user-facing units
  allocatedSpace: number | undefined
  readOnly: boolean
  bootable: boolean
}

export function useNewVdiForm(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const formData = reactive<NewVdiFormData>({
    source: 'empty',
    sr: undefined,
    name_label: '',
    name_description: '',
    allocatedSpace: undefined,
    readOnly: false,
    bootable: false,
  })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        sr: { required },
        name_label: { required },
        allocatedSpace: { required, minValue: minValue(1) },
      }),
    },
  })

  const { availableSrs, getSrLocation, selectedSr, srWarning } = useVdiFormBase(vm, formData)
  const { pbdsBySr } = useXoPbdCollection()

  const selectableSrs = computed(() => availableSrs.value.filter(sr => sr.content_type !== 'iso'))

  const { id: srSelectId } = useFormSelect('sr', selectableSrs, {
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

  const isPv = computed(() => vm.value.virtualizationMode === 'pv')

  async function validateAndBuildPayload(): Promise<NewVdiPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return {
      source: formData.source,
      srId: formData.sr!,
      name_label: formData.name_label.trim(),
      virtual_size: formData.allocatedSpace! * BYTES_PER_GB,
      vm: vm.value.id,
      ...(formData.name_description.trim() !== '' && { name_description: formData.name_description.trim() }),
      ...(formData.readOnly && { read_only: true }),
      ...(isPv.value && { bootable: formData.bootable }),
    }
  }

  const { readOnly, bootable, source } = toRefs(formData)

  return {
    source,
    selectedSr,
    srSelectBindings: useSelect(srSelectId, () => ({
      label: t('storage-repository'),
      ...(srWarning.value !== undefined && { warning: srWarning.value }),
    })),
    nameInputBindings: useField('name_label', () => ({ label: t('vdi-name'), required: true })),
    descriptionInputBindings: useField('name_description', () => ({ label: t('vdi-description') })),
    allocatedSpaceBindings: useField('allocatedSpace', () => ({
      label: t('allocated-space'),
      required: true,
    })),
    readOnly,
    bootable,
    isPv,
    validateAndBuildPayload,
  }
}
