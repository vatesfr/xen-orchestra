import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export type BackupLogFilterableData = FrontXoBackupLog & {
  jobName: string | undefined
}

export type BackupLogVmFilterableData = Pick<Task, 'icon' | 'to'> & {
  id: FrontXoVm['id']
  name: string
  size: number | undefined
}
