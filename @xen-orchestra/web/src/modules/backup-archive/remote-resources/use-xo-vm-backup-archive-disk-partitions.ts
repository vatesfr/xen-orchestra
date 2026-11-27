import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoBackupDiskPartition } from '@vates/types'
import type { Ref } from 'vue'

export type FrontXoBackupDiskPartition = XoBackupDiskPartition

export const useXoVmBackupArchiveDiskPartitions = defineRemoteResource({
  url: (archiveId: string, diskId: string) =>
    `${BASE_URL}/backup-archives/${encodeURIComponent(archiveId)}/disks/${encodeURIComponent(diskId)}/partitions`,
  initialData: () => [] as FrontXoBackupDiskPartition[],
  pollingIntervalMs: false,
  state: (partitions: Ref<FrontXoBackupDiskPartition[]>, context) => ({
    partitions,
    arePartitionsReady: context.isReady,
    hasPartitionsError: context.hasError,
  }),
})
