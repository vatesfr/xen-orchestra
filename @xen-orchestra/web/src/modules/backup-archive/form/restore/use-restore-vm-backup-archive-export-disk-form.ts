import {
  useRestoreVmBackupArchiveExportDestination,
  type VmBackupArchiveExportDestination,
} from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-destination.ts'
import type { VmBackupArchiveRestoreRadioOption } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { buildBackupArchiveFileName } from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import {
  type FrontXoVmBackupArchiveDisk,
  getBackupArchiveDiskSize,
} from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { required, requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmBackupArchiveExportDiskFormat = 'vhd' | 'vmdk' | 'qcow2' | 'raw'

export type RestoreVmBackupArchiveExportDiskFormData = {
  disk: FrontXoVmBackupArchiveDisk['id'] | undefined
  format: VmBackupArchiveExportDiskFormat
  destination: VmBackupArchiveExportDestination
  backupRepository: FrontXoBackupRepository['id'] | undefined
}

const FORMAT_EXTENSIONS: Record<VmBackupArchiveExportDiskFormat, string> = {
  vhd: 'vhd',
  vmdk: 'vmdk',
  qcow2: 'qcow2',
  raw: 'img',
}

const FALLBACK_DISK_NAME = 'disk'

export function useRestoreVmBackupArchiveExportDiskForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const formData = reactive<RestoreVmBackupArchiveExportDiskFormData>({
    disk: undefined,
    format: 'vhd',
    destination: 'download',
    backupRepository: backupArchive.value.backupRepository,
  })

  const destination = useRestoreVmBackupArchiveExportDestination(backupArchive, formData)

  const {
    diskOptions,
    availableBackupRepositories,
    areBackupRepositoriesReady,
    getDiskById,
    getBackupRepositoryDetails,
    getBackupRepositorySelectedLabel,
  } = destination

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        disk: { required: withMessage(required, () => t('select-a-disk-to-export')) },
        backupRepository: {
          requiredIf: withMessage(
            requiredIf(() => formData.destination === 'backup-repository'),
            () => t('select-a-backup-repository')
          ),
        },
      }),
    },
  })

  const formatOptions = computed<VmBackupArchiveRestoreRadioOption<VmBackupArchiveExportDiskFormat>[]>(() => [
    { value: 'vhd', label: 'VHD', description: t('export-disk-format-vhd-description'), icon: 'object:vdi' },
    { value: 'vmdk', label: 'VMDK', description: t('export-disk-format-vmdk-description'), icon: 'object:vdi' },
    { value: 'qcow2', label: 'QCOW2', description: t('export-disk-format-qcow2-description'), icon: 'object:vdi' },
    { value: 'raw', label: 'RAW', description: t('export-disk-format-raw-description'), icon: 'object:vdi' },
  ])

  const { id: backupRepositorySelectId } = useFormSelect('backupRepository', availableBackupRepositories, {
    searchable: true,
    required: true,
    loading: () => !areBackupRepositoriesReady.value,
    searchPlaceholder: () => t('search-a-backup-repository'),
    option: {
      label: 'name',
      value: 'id',
      properties: br => ({ details: getBackupRepositoryDetails(br) }),
      selectedLabel: br => getBackupRepositorySelectedLabel(br),
    },
  })

  const bindings = reactive({
    disk: useField('disk', () => ({ label: t('disk'), options: diskOptions.value })),
    format: useField('format', () => ({ label: t('format'), options: formatOptions.value })),
    destination: useField('destination', () => ({
      label: t('destination'),
      options: destination.destinationOptions.value,
    })),
    backupRepository: useSelect(backupRepositorySelectId, () => ({
      label: t('backup-repository'),
      info: destination.backupRepositoryInfo.value,
    })),
  })

  const selectedDisk = computed(() => getDiskById(formData.disk))

  const selectedDiskSize = computed(() =>
    selectedDisk.value === undefined ? undefined : getBackupArchiveDiskSize(selectedDisk.value)
  )

  const formattedDiskSize = computed(() =>
    selectedDiskSize.value === undefined ? t('the-disk-size') : formatSize(selectedDiskSize.value, 2)
  )

  const isRawFormat = computed(() => formData.format === 'raw')

  const sizeInfo = computed(() =>
    isRawFormat.value
      ? t('export-disk-size-raw-info', { size: formattedDiskSize.value })
      : t('export-disk-size-info', { size: formattedDiskSize.value })
  )

  const formatHint = computed(() =>
    isRawFormat.value ? t('the-file-takes-the-full-size-of-the-disk') : t('only-used-blocks-are-stored')
  )

  const formatLabel = computed(() => formatOptions.value.find(option => option.value === formData.format)?.label)

  const fileName = computed(() =>
    buildBackupArchiveFileName({
      vmName: backupArchive.value.vm.name_label,
      diskName: selectedDisk.value === undefined ? FALLBACK_DISK_NAME : destination.getDiskName(selectedDisk.value),
      timestamp: backupArchive.value.timestamp,
      extension: FORMAT_EXTENSIONS[formData.format],
    })
  )

  const path = computed(() => destination.getPath(fileName.value))

  return {
    formData,
    bindings,
    selectedDisk,
    selectedDiskSize,
    formattedDiskSize,
    isRawFormat,
    sizeInfo,
    formatHint,
    formatLabel,
    fileName,
    path,
    isDownload: destination.isDownload,
    destinationLabel: destination.destinationLabel,
    proxyName: destination.proxyName,
    getDiskName: destination.getDiskName,
    getFormattedDiskSize: destination.getFormattedDiskSize,
    validate,
    reset,
  }
}

export type RestoreVmBackupArchiveExportDiskForm = ReturnType<typeof useRestoreVmBackupArchiveExportDiskForm>
