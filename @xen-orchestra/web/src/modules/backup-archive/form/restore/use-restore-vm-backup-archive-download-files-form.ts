import type { VmBackupArchiveRestoreRadioOption } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import {
  type FrontXoBackupDiskPartition,
  useXoVmBackupArchiveDiskPartitions,
} from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-disk-partitions.ts'
import {
  type BackupArchiveFilesFormat,
  type BackupArchiveSelectedItem,
  buildBackupArchiveFileName,
  buildBackupArchiveFilesDownloadUrl,
} from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import {
  type FrontXoVmBackupArchiveDisk,
  getBackupArchiveDiskSize,
} from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type RestoreVmBackupArchiveDownloadFilesFormData = {
  diskId: string | undefined
  partitionId: FrontXoBackupDiskPartition['id'] | undefined
  selection: BackupArchiveSelectedItem[]
  format: BackupArchiveFilesFormat
}

export type RestoreVmBackupArchiveDownloadFilesForm = ReturnType<typeof useRestoreVmBackupArchiveDownloadFilesForm>

export function useRestoreVmBackupArchiveDownloadFilesForm(
  rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>,
  rawIsActive: MaybeRefOrGetter<boolean>
) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const isActive = toComputed(rawIsActive)

  const formData = reactive<RestoreVmBackupArchiveDownloadFilesFormData>({
    diskId: backupArchive.value.disks[0]?.id,
    partitionId: undefined,
    selection: [],
    format: 'zip',
  })

  const disks = computed(() => backupArchive.value.disks)

  const { partitions, arePartitionsReady, hasPartitionsError } = useXoVmBackupArchiveDiskPartitions(
    { isEnabled: computed(() => isActive.value && formData.diskId !== undefined) },
    () => backupArchive.value.id,
    () => formData.diskId ?? ''
  )

  const hasPartitions = computed(() => partitions.value.length > 0)

  const selectedDisk = computed(() => disks.value.find(disk => disk.id === formData.diskId))

  const selectedPartition = computed(() => partitions.value.find(partition => partition.id === formData.partitionId))

  watch(
    () => formData.diskId,
    () => {
      formData.partitionId = undefined
    }
  )

  watch(
    [arePartitionsReady, partitions],
    ([isReady, availablePartitions]) => {
      if (isReady && formData.partitionId === undefined && availablePartitions.length > 0) {
        formData.partitionId = availablePartitions[0].id
      }
    },
    { immediate: true }
  )

  watch(
    () => [formData.diskId, formData.partitionId],
    () => {
      formData.selection = []
    }
  )

  const canBrowse = computed(
    () =>
      formData.diskId !== undefined &&
      arePartitionsReady.value &&
      (!hasPartitions.value || formData.partitionId !== undefined)
  )

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        diskId: { required: withMessage(required, () => t('select-a-disk')) },
        partitionId: {
          requiredIf: withMessage(
            requiredIf(() => hasPartitions.value),
            () => t('select-a-partition')
          ),
        },
        selection: { required: withMessage(required, () => t('select-at-least-one-file-or-folder')) },
      }),
    },
  })

  function getDiskLabel(disk: FrontXoVmBackupArchiveDisk) {
    const name = disk.name || t('unknown')
    const size = getBackupArchiveDiskSize(disk)

    return size === undefined ? name : `${name} — ${formatSize(size, 1)}`
  }

  function getPartitionLabel(partition: FrontXoBackupDiskPartition) {
    return `${partition.name ?? partition.id} — ${formatSize(partition.size, 1)}`
  }

  const formatOptions = computed<VmBackupArchiveRestoreRadioOption<BackupArchiveFilesFormat>[]>(() => [
    { value: 'zip', label: t('zip'), description: t('zip-description'), icon: 'object:backup-archive' },
    { value: 'tgz', label: t('tar-gz'), description: t('tar-gz-description'), icon: 'object:backup-archive' },
  ])

  const { id: diskSelectId } = useFormSelect('diskId', disks, {
    required: true,
    option: {
      value: 'id',
      label: disk => getDiskLabel(disk),
    },
  })

  const { id: partitionSelectId } = useFormSelect('partitionId', partitions, {
    required: () => hasPartitions.value,
    disabled: () => !hasPartitions.value,
    loading: () => formData.diskId !== undefined && !arePartitionsReady.value,
    option: {
      value: 'id',
      label: partition => getPartitionLabel(partition),
    },
  })

  const bindings = reactive({
    disk: useSelect(diskSelectId, () => ({
      label: t('disk'),
      infos: [t('download-files-disk-info')],
    })),
    partition: useSelect(partitionSelectId, () => ({
      label: t('partition'),
      infos: [t('download-files-partition-info'), t('download-files-partition-unsupported-info')],
    })),
    selection: useField('selection'),
    format: useField('format', () => ({ label: t('format'), options: formatOptions.value })),
  })

  const rootLabel = computed(() => selectedPartition.value?.name ?? selectedDisk.value?.name ?? '')

  const formatLabel = computed(() => formatOptions.value.find(option => option.value === formData.format)?.label)

  const selectedDiskSize = computed(() =>
    selectedDisk.value === undefined ? undefined : getBackupArchiveDiskSize(selectedDisk.value)
  )

  const fileName = computed(() =>
    buildBackupArchiveFileName({
      vmName: backupArchive.value.vm.name_label,
      partitionName: selectedPartition.value?.name,
      timestamp: backupArchive.value.timestamp,
      extension: formData.format,
    })
  )

  const downloadUrl = computed(() =>
    formData.diskId === undefined
      ? undefined
      : buildBackupArchiveFilesDownloadUrl({
          archiveId: backupArchive.value.id,
          diskId: formData.diskId,
          partitionId: formData.partitionId,
          paths: formData.selection.map(item => item.path),
          format: formData.format,
        })
  )

  return {
    formData,
    bindings,
    validate,
    reset,
    backupArchive,
    hasPartitionsError,
    selectedDisk,
    selectedDiskSize,
    selectedPartition,
    canBrowse,
    rootLabel,
    formatOptions,
    formatLabel,
    fileName,
    downloadUrl,
  }
}
