import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export function hasSubtask(task: Task, taskId: string): boolean {
  return task.subtasks?.some(subtask => subtask.id === taskId || hasSubtask(subtask, taskId)) ?? false
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
