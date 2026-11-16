import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export function hasSubtask(task: Task, taskId: string): boolean {
  return task.subtasks?.some(subtask => subtask.id === taskId || hasSubtask(subtask, taskId)) ?? false
}

export function findTask(tasks: Task[], taskId: string): Task | undefined {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task
    }

    const subtask = findTask(task.subtasks ?? [], taskId)

    if (subtask !== undefined) {
      return subtask
    }
  }

  return undefined
}

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

export function getTaskLabel(task: Pick<Task, 'name' | 'nameParts'>): string {
  return task.nameParts?.map(part => part.text).join('') ?? task.name ?? ''
}

export function filterTaskTree(tasks: Task[], predicate: (task: Task) => boolean): Task[] {
  return tasks.flatMap(task => {
    if (predicate(task)) {
      return [task]
    }

    const subtasks = filterTaskTree(task.subtasks ?? [], predicate)

    return subtasks.length > 0 ? [{ ...task, subtasks }] : []
  })
}

export function filterTasksByName(tasks: Task[], search: string): Task[] {
  const searchTerm = search.trim().toLocaleLowerCase()

  if (searchTerm === '') {
    return tasks
  }

  return filterTaskTree(tasks, task => getTaskLabel(task).toLocaleLowerCase().includes(searchTerm))
}
