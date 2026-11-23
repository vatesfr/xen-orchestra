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

export function pruneReadActivity(readActivityById: Record<string, number>, since: number): Record<string, number> {
  return Object.fromEntries(Object.entries(readActivityById).filter(([, activity]) => activity >= since))
}

export type TaskSeverity = 'danger' | 'warning'

const SEVERITIES: TaskSeverity[] = ['danger', 'warning']

export function getHighestSeverity(severities: (TaskSeverity | undefined)[]): TaskSeverity | undefined {
  return SEVERITIES.find(severity => severities.includes(severity))
}

export function getTaskSeverity(task: Task): TaskSeverity | undefined {
  if (task.status === 'failure' || task.status === 'interrupted') {
    return 'danger'
  }

  return getHighestSeverity([
    (task.warnings?.length ?? 0) > 0 ? 'warning' : undefined,
    ...(task.subtasks ?? []).map(subtask => getTaskSeverity(subtask)),
  ])
}
