import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import type { NewVdiPayload, VdiSource } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB, VDI_SOURCE } from '@/shared/constants.ts'
import { minValue, required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { DOMAIN_TYPE } from '@vates/types'
import { computed, type MaybeRefOrGetter, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

type NewVdiFormData = BaseVdiFormData & {
  source: VdiSource
  name_label: string
  name_description: string
  allocatedSpace: number | undefined
  readOnly: boolean
  bootable: boolean
}

export function useNewVdiForm(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const { t } = useI18n()

  const vm = toComputed(rawVm)

  const formData = reactive<NewVdiFormData>({
    source: VDI_SOURCE.EMPTY,
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

  const { srSelectBindings } = useVdiFormBase(vm, formData, { useFormSelect, useSelect })

  const isPv = computed(() => vm.value.virtualizationMode === DOMAIN_TYPE.PV)

  async function validateAndBuildPayload(): Promise<NewVdiPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return {
      source: formData.source,
      srId: formData.sr!,
      name_label: formData.name_label,
      virtual_size: formData.allocatedSpace! * ONE_GB,
      vm: vm.value.id,
      ...(formData.name_description !== '' && { name_description: formData.name_description }),
      ...(formData.readOnly && { read_only: true }),
      ...(isPv.value && { bootable: formData.bootable }),
    }
  }

  const { readOnly, bootable, source } = toRefs(formData)

  return {
    source,
    srSelectBindings,
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
