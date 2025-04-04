import type { XoTask } from '@/types/xo/task.type'
import type { Task as CoreTask } from '@core/types/task.type.ts'

export const convertTaskToCore = (task: XoTask): CoreTask => ({
  id: task.id,
  status: task.status === 'interrupted' ? 'failure' : task.status,
  name: task.properties.name,
  tag: task.properties.type,
  start: task.start,
  end: task.end,
  progress: task.properties.progress !== undefined ? task.properties.progress : undefined,
  subtasks: task.tasks !== undefined ? task.tasks.map(subtask => convertTaskToCore(subtask)) : undefined,
})
