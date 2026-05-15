import { type BaseVdiFormData, useVdiFormBase } from '@/modules/vdi/form/use-vdi-form-base.ts'
import type { NewVdiPayload, VdiSource } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import {
  getFileExtension,
  getFormatFromExtension,
  ISO_SR_FILE_EXTENSIONS,
  WRITABLE_SR_FILE_EXTENSIONS,
} from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, toRef, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const BYTES_PER_GB = 1024 ** 3

type NewVdiFormData = BaseVdiFormData & {
  source: VdiSource
  name_label: string
  name_description: string
  // GB, in user-facing units
  allocatedSpace: number | undefined
  file: File | undefined
  url: string
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
    file: undefined,
    url: '',
    readOnly: false,
    bootable: false,
  })

  const { availableSrs, getSrLocation, selectedSr, srWarning, useField, useSelect } = useVdiFormBase(vm, formData)

  // ISO SRs only make sense when the user imports content; an empty VDI has no use there.
  const selectableSrs = computed(() =>
    formData.source === 'empty' ? availableSrs.value.filter(sr => sr.content_type !== 'iso') : availableSrs.value
  )

  // Reset source-specific state when switching modes
  watch(
    () => formData.source,
    next => {
      if (next !== 'file') {
        formData.file = undefined
      }
      if (next !== 'url') {
        formData.url = ''
      }
    }
  )

  // Track the last value we auto-filled so we can refresh it on file change without
  // overwriting a name the user has typed by hand.
  let lastAutoFilledName: string | undefined

  // For "file" source: derive name_label and allocatedSpace from the picked file
  watch(
    () => formData.file,
    file => {
      if (file === undefined) {
        return
      }

      if (formData.name_label === '' || formData.name_label === lastAutoFilledName) {
        const derivedName = file.name.replace(/\.[^.]+$/, '')
        formData.name_label = derivedName
        lastAutoFilledName = derivedName
      }

      formData.allocatedSpace = Math.max(1, Math.ceil(file.size / BYTES_PER_GB))
    }
  )

  const { id: srSelectId } = useFormSelect(selectableSrs, {
    searchable: true,
    required: true,
    model: toRef(formData, 'sr'),
    option: {
      label: sr => {
        const gbLeft = Math.floor((sr.size - sr.physical_usage) / BYTES_PER_GB)
        return `${sr.name_label} (${getSrLocation(sr)}) - ${t('n-gb-left', { n: gbLeft })}`
      },
      value: 'id',
    },
  })

  const isPv = computed(() => vm.value.virtualizationMode === 'pv')

  const isSrIso = computed(() => selectedSr.value?.content_type === 'iso')

  const acceptedFileExtensions = computed(() =>
    isSrIso.value ? [...ISO_SR_FILE_EXTENSIONS] : [...WRITABLE_SR_FILE_EXTENSIONS]
  )

  const fileFormat = computed(() =>
    formData.file !== undefined ? getFormatFromExtension(getFileExtension(formData.file)) : undefined
  )

  const isFileCompatibleWithSr = computed(() => {
    if (formData.file === undefined || selectedSr.value === undefined) {
      return true
    }
    const extension = getFileExtension(formData.file)
    return extension !== undefined && acceptedFileExtensions.value.includes(extension as never)
  })

  const canSubmit = computed(() => {
    if (!formData.sr || formData.name_label.trim() === '') {
      return false
    }
    if (formData.source === 'empty') {
      return formData.allocatedSpace !== undefined && formData.allocatedSpace > 0
    }
    if (formData.source === 'file') {
      return formData.file !== undefined && fileFormat.value !== undefined && isFileCompatibleWithSr.value
    }
    return formData.url.trim() !== ''
  })

  function validateAndBuildPayload(): NewVdiPayload | undefined {
    if (!canSubmit.value || !formData.sr) {
      return undefined
    }

    const base: NewVdiPayload = {
      source: formData.source,
      srId: formData.sr,
      name_label: formData.name_label.trim(),
      virtual_size: (formData.allocatedSpace ?? 0) * BYTES_PER_GB,
      vm: vm.value.id,
      ...(formData.name_description.trim() !== '' && { name_description: formData.name_description.trim() }),
      ...(formData.readOnly && { read_only: true }),
      ...(isPv.value && { bootable: formData.bootable }),
    }

    if (formData.source === 'file' && formData.file !== undefined && fileFormat.value !== undefined) {
      base.file = formData.file
      base.format = fileFormat.value
    }

    if (formData.source === 'url') {
      base.url = formData.url.trim()
    }

    return base
  }

  const { readOnly, bootable, file, source } = toRefs(formData)

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
      required: formData.source !== 'file',
      readonly: formData.source === 'file',
    })),
    urlInputBindings: useField('url', () => ({ label: t('url'), required: true })),
    readOnly,
    bootable,
    file,
    isPv,
    isSrIso,
    acceptedFileExtensions,
    isFileCompatibleWithSr,
    canSubmit,
    validateAndBuildPayload,
  }
}
