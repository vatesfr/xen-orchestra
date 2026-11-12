import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

export function hasSubtask(task: Task, taskId: string): boolean {
  return task.subtasks?.some(subtask => subtask.id === taskId || hasSubtask(subtask, taskId)) ?? false
}
