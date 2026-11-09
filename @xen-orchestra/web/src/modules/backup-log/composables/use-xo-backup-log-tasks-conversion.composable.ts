import { useXoBackupLogTaskName } from '@/modules/backup-log/composables/use-xo-backup-log-task-name.composable.ts'
import type { BackupLogTask } from '@/modules/backup-log/composables/use-xo-backup-log-utils.composable.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoBackupLogTasksConversion(rawBackupLog: MaybeRefOrGetter<FrontXoBackupLog>) {
  const backupLog = toComputed(rawBackupLog)

  const { getTaskName } = useXoBackupLogTaskName()

  function convertTask(task: BackupLogTask): Task {
    return {
      id: task.id,
      status: task.status === 'interrupted' ? 'failure' : task.status,
      ...getTaskName(task),
      progress: typeof task.data?.progress === 'number' ? task.data.progress : 0,
      start: task.start,
      end: task.end,
      infos: task.infos,
      warnings: task.warnings,
      subtasks: task.tasks?.map(convertTask),
    }
  }

  const convertedTasks = computed(() => (backupLog.value.tasks ?? []).map(convertTask))

  return { convertedTasks }
}
