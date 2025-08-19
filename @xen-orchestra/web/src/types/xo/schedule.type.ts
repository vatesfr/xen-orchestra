import type { XoMetadataBackup } from '@/types/xo/metadata-backup.type.ts'
import type { XoMirrorBackup } from '@/types/xo/mirror-backup.type.ts'
import type { XoVmBackup } from '@/types/xo/vm-backup.type.ts'
import type { Branded } from '@core/types/utility.type'

export type XoSchedule = {
  id: Branded<'schedule'>
  type: 'schedule'
  jobId: XoVmBackup['id'] | XoMetadataBackup['id'] | XoMirrorBackup['id']
  name?: string
  enabled: boolean
  cron: string
  timezone?: string
}
