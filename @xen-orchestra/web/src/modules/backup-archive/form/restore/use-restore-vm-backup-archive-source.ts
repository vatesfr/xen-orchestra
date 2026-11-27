import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import {
  type FrontXoVmBackupArchiveDisk,
  getBackupArchiveDiskSize,
} from '@/modules/backup-archive/utils/xo-vm-backup-archive-disk.util.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { IconName } from '@core/icons'
import { formatSize } from '@core/utils/size.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export type VmBackupArchiveRestoreRadioOption<TValue extends string> = {
  value: TValue
  label: string
  description?: string
  icon?: IconName
}

export function useRestoreVmBackupArchiveSource(rawBackupArchive: MaybeRefOrGetter<FrontXoVmBackupArchive>) {
  const { t } = useI18n()

  const backupArchive = toComputed(rawBackupArchive)

  const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

  const { useGetProxyById } = useXoProxyCollection()

  const sourceBackupRepository = useGetBackupRepositoryById(() => backupArchive.value.backupRepository)

  const proxy = useGetProxyById(() => sourceBackupRepository.value?.proxy)

  const proxyName = computed(() => proxy.value?.name)

  const disks = computed(() => backupArchive.value.disks)

  function getDiskName(disk: FrontXoVmBackupArchiveDisk) {
    return disk.name || t('unknown')
  }

  function getDiskById(diskId: FrontXoVmBackupArchiveDisk['id'] | undefined) {
    return disks.value.find(disk => disk.id === diskId)
  }

  function getFormattedDiskSize(disk: FrontXoVmBackupArchiveDisk) {
    const size = getBackupArchiveDiskSize(disk)

    return size === undefined ? undefined : formatSize(size, 2)
  }

  const diskOptions = computed<VmBackupArchiveRestoreRadioOption<FrontXoVmBackupArchiveDisk['id']>[]>(() =>
    disks.value.map(disk => ({
      value: disk.id,
      label: getDiskName(disk),
      description: getFormattedDiskSize(disk),
      icon: 'object:vdi',
    }))
  )

  return {
    backupArchive,
    sourceBackupRepository,
    proxyName,
    disks,
    diskOptions,
    getDiskName,
    getDiskById,
    getFormattedDiskSize,
  }
}
