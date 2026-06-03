import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { getPbdsConnectionStatus } from '@/modules/pbd/utils/xo-pbd.util.ts'
import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { DuplicateVmPayload } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { objectIcon } from '@core/icons'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { VM_POWER_STATE } from '@vates/types'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type DuplicateVmFormData = {
  name: string
  copyMode: 'fastClone' | 'fullCopy'
  compressionMode: 'disabled' | 'gzip' | 'zstd'
  sr: FrontXoSr | undefined
}

export function useDuplicateVmForm(vm: FrontXoVm) {
  const { t } = useI18n()

  const { srs } = useXoSrCollection()

  const { pbdsBySr } = useXoPbdCollection()

  const formData = reactive<DuplicateVmFormData>({
    name: `${vm.name_label}_COPY`,
    copyMode: vm.power_state === VM_POWER_STATE.HALTED ? 'fastClone' : 'fullCopy',
    compressionMode: 'disabled',
    sr: undefined,
  })

  const isFullCopy = computed(() => formData.copyMode === 'fullCopy')

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required: withMessage(required, () => t('vm-name-required')) },
        sr: { requiredIf: withMessage(requiredIf(isFullCopy), () => t('sr-required')) },
      }),
    },
  })

  const copyModeOptions = computed(() => [
    { label: t('fast-clone'), value: 'fastClone' as const, disabled: vm.power_state !== VM_POWER_STATE.HALTED },
    { label: t('full-copy'), value: 'fullCopy' as const },
  ])

  const compressionModeOptions = computed(() => [
    { label: t('disabled'), value: 'disabled' as const },
    { label: t('gzip'), value: 'gzip' as const },
    { label: t('zstd'), value: 'zstd' as const },
  ])

  const filteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.size > 0))

  const { id: srSelectId } = useFormSelect('sr', filteredSrs, {
    required: () => isFullCopy.value,
    searchable: true,
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
        return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
      },
      properties: sr => ({ icon: objectIcon('sr', getPbdsConnectionStatus(pbdsBySr.value.get(sr.id) ?? [])) }),
    },
  })

  const isCrossPool = computed(() => formData.sr !== undefined && formData.sr.$pool !== vm.$pool)

  async function validateAndBuildPayload(): Promise<DuplicateVmPayload | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    if (formData.copyMode === 'fastClone' || formData.sr === undefined) {
      return { name_label: formData.name, fast: true }
    }

    return {
      name_label: formData.name,
      srId: formData.sr.id,
      ...(formData.compressionMode !== 'disabled' && { compress: formData.compressionMode }),
    }
  }

  return {
    formData,
    copyModeOptions,
    compressionModeOptions,
    nameInputBindings: useField('name', () => ({ label: t('vm-name'), required: true })),
    copyModeBindings: useField('copyMode'),
    compressionModeBindings: useField('compressionMode'),
    srSelectBindings: useSelect(srSelectId, () => ({ label: t('storage-repository') })),
    isCrossPool,
    validateAndBuildPayload,
  }
}
