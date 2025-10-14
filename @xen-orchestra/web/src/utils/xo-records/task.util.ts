import type { XoTask } from '@vates/types'

export type BackupLogResult = { message: string; stack: unknown }

export function getTasksResultsRecursively(task: XoTask, rawType: 'failure' | 'warning' | 'info'): BackupLogResult[] {
  const data: BackupLogResult[] = []

  const type = rawType === 'failure' ? 'failure' : (`${rawType}s` as 'warning' | 'infos')

  if (type === 'failure') {
    if (task.status === 'failure' && task.result !== undefined) {
      data.push({
        message: (task.result.message as string) ?? 'Unknown error',
        stack: task.result.stack ?? '',
      })
    }
  } else if (type in task && Array.isArray(task[type]) && task[type].length > 0) {
    for (const taskResult of task[type] ?? []) {
      data.push({
        message: taskResult.message ?? 'Unknown message',
        stack: taskResult.data ?? '',
      })
    }
  }

  if (Array.isArray(task.tasks) && task.tasks.length > 0) {
    data.push(...task.tasks.flatMap(taskItem => getTasksResultsRecursively(taskItem, rawType)))
  }

  return data
}
