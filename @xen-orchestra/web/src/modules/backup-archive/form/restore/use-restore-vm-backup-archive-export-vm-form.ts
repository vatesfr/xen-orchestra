import {
  useRestoreVmBackupArchiveExportDestination,
  type VmBackupArchiveExportDestination,
} from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-export-destination.ts'
import type { VmBackupArchiveRestoreRadioOption } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { buildBackupArchiveFileName } from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import { getBackupArchiveDisksTotalSize } from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { VmExportCompression } from '@/modules/vm/jobs/xo-vm-export.job.ts'
import { requiredIf, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type RestoreVmBackupArchiveExportVmFormData = {
  compression: VmExportCompression
  destination: VmBackupArchiveExportDestination
  backupRepository: FrontXoBackupRepository['id'] | undefined
}

const XVA_EXTENSION = 'xva'

export function useRestoreVmBackupArchiveExportVmForm(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const formData = reactive<RestoreVmBackupArchiveExportVmFormData>({
    compression: 'zstd',
    destination: 'backup-repository',
    backupRepository: backupArchive.value.backupRepository,
  })

  const destination = useRestoreVmBackupArchiveExportDestination(backupArchive, formData)

  const {
    disks,
    availableBackupRepositories,
    areBackupRepositoriesReady,
    getBackupRepositoryDetails,
    getBackupRepositorySelectedLabel,
  } = destination

  const { useField, useFormSelect, useSelect, validate, reset } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        backupRepository: {
          requiredIf: withMessage(
            requiredIf(() => formData.destination === 'backup-repository'),
            () => t('select-a-backup-repository')
          ),
        },
      }),
    },
  })

  const compressionOptions = computed<VmBackupArchiveRestoreRadioOption<VmExportCompression>[]>(() => [
    { value: 'none', label: t('none'), description: t('export-vm-compression-none-description'), icon: 'fa:microchip' },
    { value: 'gzip', label: t('gzip'), description: t('export-vm-compression-gzip-description'), icon: 'fa:microchip' },
    { value: 'zstd', label: t('zstd'), description: t('export-vm-compression-zstd-description'), icon: 'fa:microchip' },
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
    compression: useField('compression', () => ({ label: t('compression'), options: compressionOptions.value })),
    destination: useField('destination', () => ({
      label: t('destination'),
      options: destination.destinationOptions.value,
    })),
    backupRepository: useSelect(backupRepositorySelectId, () => ({
      label: t('backup-repository'),
      info: destination.backupRepositoryInfo.value,
    })),
  })

  const vmName = computed(() => backupArchive.value.vm.name_label)

  const contentLabel = computed(() => {
    const parts = [vmName.value, t('n-disks', { n: disks.value.length })]

    const totalDisksSize = getBackupArchiveDisksTotalSize(disks.value)

    if (totalDisksSize !== undefined) {
      parts.push(formatSize(totalDisksSize, 2))
    }

    return parts.join(' · ')
  })

  const formatLabel = computed(() => `${t('xva')} · ${t('imports-into-xcp-ng-and-xenserver')}`)

  const compressionLabel = computed(
    () => compressionOptions.value.find(option => option.value === formData.compression)?.label
  )

  const fileName = computed(() =>
    buildBackupArchiveFileName({
      vmName: vmName.value,
      timestamp: backupArchive.value.timestamp,
      extension: XVA_EXTENSION,
    })
  )

  const path = computed(() => destination.getPath(fileName.value))

  return {
    formData,
    bindings,
    vmName,
    formatLabel,
    compressionLabel,
    contentLabel,
    fileName,
    path,
    isDownload: destination.isDownload,
    destinationLabel: destination.destinationLabel,
    proxyName: destination.proxyName,
    validate,
    reset,
  }
}

export type RestoreVmBackupArchiveExportVmForm = ReturnType<typeof useRestoreVmBackupArchiveExportVmForm>
