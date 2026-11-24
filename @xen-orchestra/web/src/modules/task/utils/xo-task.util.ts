import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { CircleProgressBarAccent } from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import { createMapper } from '@core/packages/mapper'
import type { RouteLocationAsRelative } from 'vue-router'

export type BackupLogResult = { message: string; stack: unknown }

export function getTasksResultsRecursively(
  task: FrontXoTask,
  rawType: 'failure' | 'warning' | 'info'
): BackupLogResult[] {
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

export function findTaskById(tasks: FrontXoTask[], taskId: FrontXoTask['id']): FrontXoTask | undefined {
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

export function getTaskRoute(taskId: FrontXoTask['id']): RouteLocationAsRelative {
  return {
    name: '/(site)/tasks',
    query: { id: taskId },
  }
}

// sum of the reading speeds, in bytes per second, of the sources still read by a running task and its subtasks
export function getTaskReadingSpeed(task: FrontXoTask): number | undefined {
  // not `end`: a task interrupted by a restart of xo-server has none
  if (task.status !== 'pending') {
    return undefined
  }

  const { speed } = task.properties

  if (typeof speed === 'number') {
    return speed
  }

  let sum: number | undefined

  for (const subtask of task.tasks ?? []) {
    const subtaskSpeed = getTaskReadingSpeed(subtask)

    if (subtaskSpeed !== undefined) {
      sum = (sum ?? 0) + subtaskSpeed
    }
  }

  return sum
}

function getTaskBytesRead(task: FrontXoTask): number | undefined {
  const { bytesRead } = task.properties

  if (typeof bytesRead === 'number') {
    return bytesRead
  }

  let sum: number | undefined

  for (const subtask of task.tasks ?? []) {
    const subtaskBytesRead = getTaskBytesRead(subtask)

    if (subtaskBytesRead !== undefined) {
      sum = (sum ?? 0) + subtaskBytesRead
    }
  }

  return sum
}

// bytes read by an ended task and its subtasks over its whole duration, which is more than the time spent reading for
// the tasks that are not reading a source themselves
export function getTaskAverageReadingSpeed(task: FrontXoTask): number | undefined {
  if (task.end === undefined || task.end <= task.start) {
    return undefined
  }

  const bytesRead = getTaskBytesRead(task)

  return bytesRead !== undefined ? Math.round((bytesRead * 1e3) / (task.end - task.start)) : undefined
}
