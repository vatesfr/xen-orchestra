import {
  useRestoreVmBackupArchiveSource,
  type VmBackupArchiveRestoreRadioOption,
} from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { formatSize } from '@core/utils/size.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmBackupArchiveExportDestination = 'download' | 'backup-repository'

const EXPORT_FOLDER = 'xo-exports'

export function getBackupRepositoryFreeSpace(backupRepository: FrontXoBackupRepository): number | undefined {
  return (backupRepository as FrontXoBackupRepository & { available?: number }).available
}

export type VmBackupArchiveExportDestinationFormData = {
  destination: VmBackupArchiveExportDestination
  backupRepository: FrontXoBackupRepository['id'] | undefined
}

export function useRestoreVmBackupArchiveExportDestination(
  rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>,
  formData: VmBackupArchiveExportDestinationFormData
) {
  const { t } = useI18n()

  const source = useRestoreVmBackupArchiveSource(rawBackupArchive)

  const { backupArchive, sourceBackupRepository, proxyName } = source

  const { backupRepositories, areBackupRepositoriesReady } = useXoBackupRepositoryCollection()

  const availableBackupRepositories = computed(() => {
    const sourceBr = sourceBackupRepository.value

    if (sourceBr === undefined) {
      return []
    }

    return backupRepositories.value.filter(br => br.id === sourceBr.id || (br.enabled && br.proxy === sourceBr.proxy))
  })

  const destinationOptions = computed<VmBackupArchiveRestoreRadioOption<VmBackupArchiveExportDestination>[]>(() => [
    {
      value: 'download',
      label: t('download'),
      description: t('download-description'),
      icon: 'action:download',
    },
    {
      value: 'backup-repository',
      label: t('backup-repository'),
      description: t('export-to-backup-repository-description'),
      icon: 'fa:database',
    },
  ])

  const isDownload = computed(() => formData.destination === 'download')

  const selectedBackupRepository = computed(() =>
    availableBackupRepositories.value.find(br => br.id === formData.backupRepository)
  )

  const backupRepositoryInfo = computed(() =>
    proxyName.value === undefined
      ? t('source-backup-repository-by-default')
      : t('source-backup-repository-by-default-info', { proxy: proxyName.value })
  )

  function isSourceBackupRepository(backupRepository: FrontXoBackupRepository) {
    return backupRepository.id === backupArchive.value.backupRepository
  }

  function getFormattedFreeSpace(backupRepository: FrontXoBackupRepository) {
    const freeSpace = getBackupRepositoryFreeSpace(backupRepository)

    return freeSpace === undefined ? undefined : t('size-free', { size: formatSize(freeSpace, 2) })
  }

  function joinDetails(parts: (string | undefined)[]) {
    const details = parts.filter(part => part !== undefined)

    return details.length === 0 ? undefined : details.join(' · ')
  }

  function getBackupRepositoryDetails(backupRepository: FrontXoBackupRepository) {
    return joinDetails([
      isSourceBackupRepository(backupRepository) ? t('source').toLowerCase() : undefined,
      getFormattedFreeSpace(backupRepository),
    ])
  }

  function getBackupRepositorySelectedLabel(backupRepository: FrontXoBackupRepository) {
    const isSource = isSourceBackupRepository(backupRepository)

    const details = joinDetails([
      isSource ? t('source').toLowerCase() : undefined,
      proxyName.value,
      isSource ? undefined : getFormattedFreeSpace(backupRepository),
    ])

    return details === undefined ? backupRepository.name : `${backupRepository.name} — ${details}`
  }

  const destinationLabel = computed(() => {
    if (isDownload.value) {
      return t('download')
    }

    const backupRepository = selectedBackupRepository.value

    if (backupRepository === undefined) {
      return undefined
    }

    return [
      backupRepository.name,
      isSourceBackupRepository(backupRepository) ? t('source').toLowerCase() : undefined,
      proxyName.value,
    ]
      .filter(part => part !== undefined)
      .join(' · ')
  })

  function getPath(fileName: string) {
    return `${EXPORT_FOLDER}/${fileName}`
  }

  return {
    ...source,
    availableBackupRepositories,
    areBackupRepositoriesReady,
    destinationOptions,
    isDownload,
    selectedBackupRepository,
    backupRepositoryInfo,
    destinationLabel,
    isSourceBackupRepository,
    getBackupRepositoryDetails,
    getBackupRepositorySelectedLabel,
    getPath,
  }
}
