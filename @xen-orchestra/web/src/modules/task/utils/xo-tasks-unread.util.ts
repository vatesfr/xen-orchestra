import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export function getTaskLastActivity(task: Task): number {
  return Math.max(task.start ?? 0, task.end ?? 0, ...(task.subtasks ?? []).map(subtask => getTaskLastActivity(subtask)))
}

// A task is unread when its own start/end is newer than its read time, or when one of its subtasks is unread.
// A task's read time is the latest of `readUntil` and the read times recorded for it and its parents
export function getUnreadTaskIds(
  tasks: Task[],
  readUntil: number,
  readActivityById: Record<string, number>
): Set<string> {
  const unreadTaskIds = new Set<string>()

  const isUnread = (task: Task, parentReadUntil: number): boolean => {
    const taskReadUntil = Math.max(parentReadUntil, readActivityById[task.id] ?? 0)

    if (getTaskLastActivity(task) <= taskReadUntil) {
      return false
    }

    const unreadSubtasks = (task.subtasks ?? []).filter(subtask => isUnread(subtask, taskReadUntil))
    const hasOwnActivity = Math.max(task.start ?? 0, task.end ?? 0) > taskReadUntil

    if (!hasOwnActivity && unreadSubtasks.length === 0) {
      return false
    }

    unreadTaskIds.add(task.id)

    return true
  }

  tasks.forEach(task => isUnread(task, readUntil))

  return unreadTaskIds
}

export type TaskSeverity = 'danger' | 'warning'

export function getTaskSeverity(task: Task): TaskSeverity | undefined {
  if (task.status === 'failure' || task.status === 'interrupted') {
    return 'danger'
  }

  const subtaskSeverities = (task.subtasks ?? []).map(subtask => getTaskSeverity(subtask))

  if (subtaskSeverities.includes('danger')) {
    return 'danger'
  }

  if ((task.warnings?.length ?? 0) > 0 || subtaskSeverities.includes('warning')) {
    return 'warning'
  }

  return undefined
}

// Progress of the batch as a sum over `maxValue` (100 per task): finished tasks count as 100,
// pending ones as their progress (0 when unknown). Batch tasks no longer in `tasks` are skipped
export function getBatchProgress(tasks: Task[], batchTaskIds: ReadonlySet<string>) {
  const batchTasks = tasks.filter(task => batchTaskIds.has(task.id))

  return {
    value: batchTasks.reduce((sum, task) => sum + (task.status === 'pending' ? (task.progress ?? 0) : 100), 0),
    maxValue: batchTasks.length * 100,
  }
}
