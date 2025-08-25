import { useXoMetadataBackupJobCollection } from '@/remote-resources/use-xo-metadata-backup-job-collection.ts'
import { useXoMirrorBackupJobCollection } from '@/remote-resources/use-xo-mirror-backup-job-collection.ts'
import { useXoVmBackupJobCollection } from '@/remote-resources/use-xo-vm-backup-job-collection.ts'
import type { XoMetadataBackupJob } from '@/types/xo/metadata-backup-job.type.ts'
import type { XoMirrorBackupJob } from '@/types/xo/mirror-backup-job.type.ts'
import type { XoVmBackupJob } from '@/types/xo/vm-backup-job.type.ts'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'

export type XoBackupJob = XoVmBackupJob | XoMetadataBackupJob | XoMirrorBackupJob

export function useXoBackupJobCollection() {
  const { vmBackupJobs, hasVmBackupJobFetchError } = useXoVmBackupJobCollection()
  const { metadataBackupJobs, hasMetadataBackupJobFetchError } = useXoMetadataBackupJobCollection()
  const { mirrorBackupJobs, hasMirrorBackupJobFetchError } = useXoMirrorBackupJobCollection()

  const backupJobs = computed(() =>
    [...vmBackupJobs.value, ...metadataBackupJobs.value, ...mirrorBackupJobs.value].sort((backup1, backup2) =>
      backup1.name.localeCompare(backup2.name)
    )
  )

  const hasFetchError = logicOr(hasVmBackupJobFetchError, hasMetadataBackupJobFetchError, hasMirrorBackupJobFetchError)

  return {
    backupJobs,
    hasFetchError,
  }
}
