import type { CircleProgressBarAccent } from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import type { TaskStatus } from '@core/types/task.type.ts'
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

export type StatusAccent = 'info' | 'warning' | 'danger' | 'success'

export type TaskAccents = {
  statusAccent: StatusAccent
  progressAccent: CircleProgressBarAccent
}

export const getTaskAccents = (status: TaskStatus): TaskAccents => {
  switch (status) {
    case 'pending':
      return { statusAccent: 'info', progressAccent: 'info' }
    case 'success':
      return { statusAccent: 'success', progressAccent: 'info' }
    case 'failure':
      return { statusAccent: 'danger', progressAccent: 'danger' }
    default:
      return { statusAccent: 'info', progressAccent: 'info' }
  }
}

export function findTaskById(tasks: XoTask[], taskId: XoTask['id']): XoTask | undefined {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task
    }

    if (task.tasks && task.tasks.length > 0) {
      const foundInSubtasks = findTaskById(task.tasks, taskId)
      if (foundInSubtasks) {
        return foundInSubtasks
      }
    }
  }

  return undefined
}
