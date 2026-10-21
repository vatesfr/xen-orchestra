import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { CircleProgressBarAccent } from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import { createMapper } from '@core/packages/mapper'
import type { XoTask } from '@vates/types'
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

export type TaskTree = Pick<XoTask, 'start' | 'end' | 'properties'> & { tasks?: TaskTree[] }

export type TaskRead = {
  /** bytes to read from the sources, unknown if one of them doesn't report it */
  bytesToRead: number | undefined
  bytesRead: number
  /** average speed once the task has ended, otherwise the speed of the reads still running */
  bytesPerSecond: number
}

function getNumberProperty(task: TaskTree, name: string) {
  const value = task.properties[name]

  return typeof value === 'number' ? value : undefined
}

function getAverageSpeed(task: TaskTree, bytes: number, now: number) {
  const elapsedMs = (task.end ?? now) - task.start

  return elapsedMs > 0 ? (bytes * 1e3) / elapsedMs : 0
}

// bytesPerSecond only counts the reads still running
function sumReads(task: TaskTree, now: number): TaskRead | undefined {
  const bytesRead = getNumberProperty(task, 'bytesRead')

  if (bytesRead !== undefined) {
    return {
      bytesToRead: getNumberProperty(task, 'bytesToRead'),
      bytesRead,
      bytesPerSecond: task.end === undefined ? getAverageSpeed(task, bytesRead, now) : 0,
    }
  }

  let total: TaskRead | undefined

  for (const subtask of task.tasks ?? []) {
    const read = sumReads(subtask, now)

    if (read === undefined) {
      continue
    }

    if (total === undefined) {
      total = { ...read }
    } else {
      total.bytesToRead =
        total.bytesToRead === undefined || read.bytesToRead === undefined
          ? undefined
          : total.bytesToRead + read.bytesToRead
      total.bytesRead += read.bytesRead
      total.bytesPerSecond += read.bytesPerSecond
    }
  }

  return total
}

/**
 * Sums the bytes read from the sources (backups, restores) reported in a task and its subtasks.
 *
 * The backend reports them in one task per source (`read disk …`, `read`): a source consumed by multiple writers
 * is counted once, the written bytes are not reported here.
 *
 * A task reporting its own `bytesRead` is a source: its subtasks are not visited, so the same bytes are never
 * counted twice.
 */
export function getTaskRead(task: TaskTree, now = Date.now()): TaskRead | undefined {
  const total = sumReads(task, now)

  if (total !== undefined && task.end !== undefined) {
    total.bytesPerSecond = getAverageSpeed(task, total.bytesRead, now)
  }

  return total
}
