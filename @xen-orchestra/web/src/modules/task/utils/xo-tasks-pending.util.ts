import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'

// Progress of the batch as a sum over `maxValue` (100 per task): finished tasks count as 100,
// pending ones as their progress (0 when unknown). Batch tasks no longer in `tasks` are skipped
export function getBatchProgress(tasks: Task[], batchTaskIds: ReadonlySet<string>) {
  const batchTasks = tasks.filter(task => batchTaskIds.has(task.id))

  return {
    value: batchTasks.reduce((sum, task) => sum + (task.status === 'pending' ? (task.progress ?? 0) : 100), 0),
    maxValue: batchTasks.length * 100,
  }
}
