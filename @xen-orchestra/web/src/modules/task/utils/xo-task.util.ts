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

export type TransferTask = Pick<XoTask, 'start' | 'end' | 'properties'> & { tasks?: TransferTask[] }

export type TaskTransfer = {
  /** total bytes to transfer, unknown if one of the transfers doesn't report it */
  size: number | undefined
  transferredSize: number
  /** average speed once the task has ended, otherwise the speed of the transfers still running */
  bytesPerSecond: number
}

function getNumberProperty(task: TransferTask, name: string) {
  const value = task.properties[name]

  return typeof value === 'number' ? value : undefined
}

function getAverageSpeed(task: TransferTask, transferredSize: number, now: number) {
  const elapsedMs = (task.end ?? now) - task.start

  return elapsedMs > 0 ? (transferredSize * 1e3) / elapsedMs : 0
}

// bytesPerSecond only counts the transfers still running
function sumTransfers(task: TransferTask, now: number): TaskTransfer | undefined {
  const transferredSize = getNumberProperty(task, 'transferredSize')

  if (transferredSize !== undefined) {
    return {
      size: getNumberProperty(task, 'size'),
      transferredSize,
      bytesPerSecond: task.end === undefined ? getAverageSpeed(task, transferredSize, now) : 0,
    }
  }

  let total: TaskTransfer | undefined

  for (const subtask of task.tasks ?? []) {
    const transfer = sumTransfers(subtask, now)

    if (transfer === undefined) {
      continue
    }

    if (total === undefined) {
      total = { ...transfer }
    } else {
      total.size = total.size === undefined || transfer.size === undefined ? undefined : total.size + transfer.size
      total.transferredSize += transfer.transferredSize
      total.bytesPerSecond += transfer.bytesPerSecond
    }
  }

  return total
}

/**
 * Sums the transfers (backups, restores) reported in a task and its subtasks.
 *
 * A task reporting its own `transferredSize` is a transfer: its subtasks are not visited, so the same bytes are
 * never counted twice.
 */
export function getTaskTransfer(task: TransferTask, now = Date.now()): TaskTransfer | undefined {
  const total = sumTransfers(task, now)

  if (total !== undefined && task.end !== undefined) {
    total.bytesPerSecond = getAverageSpeed(task, total.transferredSize, now)
  }

  return total
}
