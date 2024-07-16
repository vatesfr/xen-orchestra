import type { Task } from '@/types/task.type'
import type { Task as CoreTask } from '@core/types/task.type'

export const convertTaskToCore = (task: Task): CoreTask => ({
  id: task.id,
  status: task.status === 'interrupted' ? 'failure' : task.status,
  name: task.properties.name,
  tag: task.properties.type,
  start: task.start,
  end: task.end,
  subtasks: task.tasks !== undefined ? task.tasks.map(subtask => convertTaskToCore(subtask)) : undefined,
})
