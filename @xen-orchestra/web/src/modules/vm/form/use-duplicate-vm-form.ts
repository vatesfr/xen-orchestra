import {
  type FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { type DuplicateVmPayload, useXoVmDuplicateJob } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { VM_POWER_STATE } from '@vates/types'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type DuplicateVmFormData = {
  name: string
  copyMode: 'fastClone' | 'fullCopy'
  compressionMode: 'disabled' | 'gzip' | 'zstd'
}

export function useDuplicateVmForm(vm: FrontXoVm) {
  const { t } = useI18n()

  const { srs } = useXoSrCollection()

  const formData = reactive<DuplicateVmFormData>({
    name: `${vm.name_label}_COPY`,
    copyMode: vm.power_state === VM_POWER_STATE.HALTED ? 'fastClone' : 'fullCopy',
    compressionMode: 'disabled',
  })

  const {
    copyMode: copyModeBindings,
    compressionMode: compressionModeBindings,
    useField,
    useSelect,
  } = useFormBindings(formData)

  const filteredSrs = computed(() => srs.value.filter(sr => sr.content_type !== 'iso' && sr.size > 0))

  const selectedSr = ref<FrontXoSr | undefined>()

  const { id: srSelectId } = useFormSelect(filteredSrs, {
    required: true,
    model: selectedSr,
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / 1024 ** 3)
        return `${sr.name_label} - ${t('n-gb-left', { n: gbLeft })}`
      },
    },
  })

  const isSrEmpty = computed(() => formData.copyMode === 'fullCopy' && selectedSr.value === undefined)

  const nameInputBindings = useField('name', (): { error?: InputWrapperMessage } => ({
    error: formData.name.trim() === '' ? { content: t('duplicate-vm:name-required'), accent: 'danger' } : undefined,
  }))

  const srSelectBindings = useSelect(srSelectId, (): { error?: InputWrapperMessage } => ({
    error: isSrEmpty.value ? { content: t('duplicate-vm:sr-required'), accent: 'danger' } : undefined,
  }))

  const isCrossPool = computed(() => selectedSr.value !== undefined && selectedSr.value.$pool !== vm.$pool)

  const payload = computed<DuplicateVmPayload>(() => {
    if (formData.copyMode === 'fastClone' || selectedSr.value === undefined) {
      return { name_label: formData.name, fast: true }
    }
    return {
      name_label: formData.name,
      srId: selectedSr.value.id,
      ...(formData.compressionMode !== 'disabled' && { compress: formData.compressionMode }),
    }
  })

  const duplicateJob = useXoVmDuplicateJob(() => vm, payload)

  const canDuplicate = computed(() => duplicateJob.canRun.value && formData.name.trim() !== '' && !isSrEmpty.value)

  async function handleDuplicate() {
    if (!canDuplicate.value) {
      return
    }

    if (formData.copyMode === 'fullCopy' && selectedSr.value === undefined) {
      return
    }

    await duplicateJob.run()
  }

  return {
    formData,
    nameInputBindings,
    copyModeBindings,
    compressionModeBindings,
    srSelectBindings,
    isCrossPool,
    duplicateJob,
    canDuplicate,
    handleDuplicate,
  }
}
