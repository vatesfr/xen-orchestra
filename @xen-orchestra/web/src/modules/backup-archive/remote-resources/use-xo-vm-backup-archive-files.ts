import { buildBackupArchiveFilesUrl } from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { Ref } from 'vue'

export type FrontXoVmBackupArchiveFile = {
  name: string
  isFile: boolean
  size?: number
}

export const useXoVmBackupArchiveFiles = defineRemoteResource({
  url: (archiveId: string, diskId: string, partitionId: string | undefined, path: string) =>
    buildBackupArchiveFilesUrl({ archiveId, diskId, partitionId, path }),
  initialData: () => [] as FrontXoVmBackupArchiveFile[],
  pollingIntervalMs: false,
  state: (files: Ref<FrontXoVmBackupArchiveFile[]>, context) => ({
    files,
    areFilesReady: context.isReady,
    hasFilesError: context.hasError,
  }),
})
