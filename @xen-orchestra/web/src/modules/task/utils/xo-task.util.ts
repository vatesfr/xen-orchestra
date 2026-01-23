import type { CircleProgressBarAccent } from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import type { FrontXoTask } from '../remote-resources/use-xo-task-collection.ts'
import { createMapper } from '@core/packages/mapper'
import type { XoTask } from '@vates/types'

export type BackupLogResult = { message: string; stack: unknown }

export function getTasksResultsRecursively(task: XoTask, rawType: 'failure' | 'warning' | 'info'): BackupLogResult[] {
  const data: BackupLogResult[] = []

  const type = rawType === 'failure' ? 'failure' : (`${rawType}s` as 'warnings' | 'infos')

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

export type TaskStatusAccent = 'info' | 'warning' | 'danger' | 'success'

export type TaskAccents = {
  statusAccent: TaskStatusAccent
  progressAccent: CircleProgressBarAccent
}

export const getTaskAccents = createMapper(
  {
    pending: { statusAccent: 'info', progressAccent: 'info' },
    success: { statusAccent: 'success', progressAccent: 'info' },
    failure: { statusAccent: 'danger', progressAccent: 'danger' },
    interrupted: { statusAccent: 'danger', progressAccent: 'danger' },
  },
  'pending'
)

export function findTaskById(tasks: FrontXoTask[], taskId: XoTask['id']): FrontXoTask | undefined {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task
    }

    if (task.tasks && task.tasks.length > 0) {
      const subTask = findTaskById(task.tasks, taskId)
      if (subTask) {
        return subTask
      }
    }
  }

  return undefined
}
