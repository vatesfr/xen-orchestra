import { useRestoreVmBackupArchiveAttachDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-attach-disk-form.ts'
import { useRestoreVmBackupArchiveCopyForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-copy-form.ts'
import { useRestoreVmBackupArchiveDownloadFilesForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-download-files-form.ts'
import { useRestoreVmBackupArchiveExportDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-disk-form.ts'
import { useRestoreVmBackupArchiveExportVmForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-vm-form.ts'
import { useRestoreVmBackupArchiveLiveForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-live-form.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { StepDefinition } from '@core/components/ui/stepper/UiStepper.vue'
import type { TagAccent, TagVariant } from '@core/components/ui/tag/UiTag.vue'
import type { IconName } from '@core/icons'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const STEPS = ['restore-type', 'options', 'review'] as const
export type VmBackupArchiveRestoreStep = (typeof STEPS)[number]

const TWO_STEP_RESTORE_TYPES: VmBackupArchiveRestoreType[] = ['attach-disk']

export type VmBackupArchiveRestoreType =
  | 'copy'
  | 'live'
  | 'attach-disk'
  | 'download-files'
  | 'export-disk'
  | 'export-vm'

export type VmBackupArchiveRestoreTypeOption = {
  value: VmBackupArchiveRestoreType
  label: string
  description: string
  icon: IconName
  tag?: { label: string; accent: TagAccent; variant: TagVariant }
  disabledReason?: string
  disabled: boolean
}

export type VmBackupArchiveRestoreTypeGroup = {
  label: string
  info: string
  options: VmBackupArchiveRestoreTypeOption[]
}

export type RestoreVmBackupArchiveFormData = {
  restoreType: VmBackupArchiveRestoreType | undefined
}

const INCREMENTAL_ONLY_RESTORE_TYPES: VmBackupArchiveRestoreType[] = [
  'live',
  'attach-disk',
  'download-files',
  'export-disk',
]

export function useRestoreVmBackupArchiveForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const isFull = computed(() => backupArchive.value.mode === 'full')

  const formData = reactive<RestoreVmBackupArchiveFormData>({
    restoreType: undefined,
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        restoreType: { required: withMessage(required, () => t('select-a-restore-type')) },
      }),
    },
  })

  function createRestoreTypeOption(
    value: VmBackupArchiveRestoreType,
    option: Pick<VmBackupArchiveRestoreTypeOption, 'label' | 'description' | 'icon' | 'tag'>
  ): VmBackupArchiveRestoreTypeOption {
    const disabled = isFull.value && INCREMENTAL_ONLY_RESTORE_TYPES.includes(value)

    return {
      value,
      ...option,
      disabled,
      disabledReason: disabled ? t('needs-an-incremental-restore-point') : undefined,
    }
  }

  const restoreTypeGroups = computed<VmBackupArchiveRestoreTypeGroup[]>(() => [
    {
      label: t('into-a-pool'),
      info: t('writes-to-a-pool'),
      options: [
        createRestoreTypeOption('copy', {
          label: t('copy-then-start'),
          description: isFull.value ? t('copy-then-start-full-description') : t('copy-then-start-description'),
          icon: 'action:copy',
          tag: { label: t('default'), accent: 'info', variant: 'secondary' },
        }),
        createRestoreTypeOption('live', {
          label: t('start-now'),
          description: t('start-now-description'),
          icon: 'action:force',
          tag: { label: t('live-restore'), accent: 'muted', variant: 'primary' },
        }),
        createRestoreTypeOption('attach-disk', {
          label: t('attach-a-disk-to-a-running-vm'),
          description: t('attach-a-disk-to-a-running-vm-description'),
          icon: 'action:attach',
        }),
      ],
    },
    {
      label: t('out-of-the-backup'),
      info: t('nothing-written-to-a-pool'),
      options: [
        createRestoreTypeOption('download-files', {
          label: t('download-files'),
          description: t('download-files-description'),
          icon: 'fa:file',
        }),
        createRestoreTypeOption('export-disk', {
          label: t('export-a-disk'),
          description: t('export-a-disk-description'),
          icon: 'fa:file-export',
        }),
        createRestoreTypeOption('export-vm', {
          label: t('export-the-vm'),
          description: t('export-the-vm-description'),
          icon: 'fa:upload',
        }),
      ],
    },
  ])

  const bindings = reactive({
    restoreType: useField('restoreType', () => ({ groups: restoreTypeGroups.value })),
  })

  const copy = useRestoreVmBackupArchiveCopyForm(backupArchive)

  const live = useRestoreVmBackupArchiveLiveForm(backupArchive)

  const attachDisk = useRestoreVmBackupArchiveAttachDiskForm(backupArchive)

  const downloadFiles = useRestoreVmBackupArchiveDownloadFilesForm(
    backupArchive,
    () => formData.restoreType === 'download-files'
  )

  const exportDisk = useRestoreVmBackupArchiveExportDiskForm(backupArchive)

  const exportVm = useRestoreVmBackupArchiveExportVmForm(backupArchive)

  const restoreTypeForms = {
    copy,
    live,
    'attach-disk': attachDisk,
    'download-files': downloadFiles,
    'export-disk': exportDisk,
    'export-vm': exportVm,
  } satisfies Record<VmBackupArchiveRestoreType, { validate: () => Promise<boolean> }>

  const restoreTypeLabel = computed(
    () =>
      restoreTypeGroups.value
        .flatMap(group => group.options)
        .find(option => option.value === formData.restoreType)?.label
  )

  const currentStepIndex = ref(0)

  const stepKeys = computed<readonly VmBackupArchiveRestoreStep[]>(() =>
    formData.restoreType !== undefined && TWO_STEP_RESTORE_TYPES.includes(formData.restoreType)
      ? STEPS.filter(step => step !== 'review')
      : STEPS
  )

  const currentStep = computed(() => stepKeys.value[currentStepIndex.value])

  const isLastStep = computed(() => currentStepIndex.value === stepKeys.value.length - 1)

  const stepLabels = computed<Record<VmBackupArchiveRestoreStep, string>>(() => ({
    'restore-type': t('restore-type'),
    options: restoreTypeLabel.value ?? t('options'),
    review: formData.restoreType === 'download-files' ? t('action:download') : t('review'),
  }))

  const steps = computed<StepDefinition[]>(() => stepKeys.value.map(step => ({ label: stepLabels.value[step] })))

  const confirmLabel = computed(() => {
    if (!isLastStep.value) {
      return t('action:continue')
    }

    switch (formData.restoreType) {
      case 'attach-disk':
        return t('action:attach-disk')
      case 'download-files':
        return t('action:download')
      case 'export-disk':
        return exportDisk.formData.destination === 'download' ? t('action:download') : t('action:export')
      case 'export-vm':
        return t('action:export')
      default:
        return t('action:restore')
    }
  })

  async function validateCurrentStep(): Promise<boolean> {
    if (currentStep.value === 'restore-type') {
      return validate()
    }

    if (formData.restoreType === undefined) {
      return false
    }

    return restoreTypeForms[formData.restoreType].validate()
  }

  function goToStep(step: VmBackupArchiveRestoreStep): void {
    currentStepIndex.value = stepKeys.value.indexOf(step)
  }

  async function next(): Promise<void> {
    const isValid = await validateCurrentStep()

    if (isValid && !isLastStep.value) {
      currentStepIndex.value++
    }
  }

  function back(): void {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  return {
    formData,
    bindings,
    copy,
    live,
    attachDisk,
    downloadFiles,
    exportDisk,
    exportVm,
    restoreTypeLabel,
    currentStep,
    currentStepIndex,
    steps,
    confirmLabel,
    goToStep,
    next,
    back,
  }
}
