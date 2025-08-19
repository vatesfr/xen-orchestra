import type { XoMetadataBackup } from '@/types/xo/metadata-backup.type.ts'
import type { XoMirrorBackup } from '@/types/xo/mirror-backup.type.ts'
import type { XoVmBackup } from '@/types/xo/vm-backup.type.ts'
import type { Branded } from '@core/types/utility.type'

export type XoBackupLog = {
  id: Branded<'backup-log'>
  type: 'backup-log'
  jobId: XoVmBackup['id'] | XoMetadataBackup['id'] | XoMirrorBackup['id']
  status: 'success' | 'failure' | 'skipped' | 'interrupted'
  end: number
}
