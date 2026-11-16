import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export function hasSubtask(task: Task, taskId: string): boolean {
  return task.subtasks?.some(subtask => subtask.id === taskId || hasSubtask(subtask, taskId)) ?? false
}

export function getTaskLastActivity(task: Task): number {
  return Math.max(task.start ?? 0, task.end ?? 0, ...(task.subtasks ?? []).map(subtask => getTaskLastActivity(subtask)))
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
