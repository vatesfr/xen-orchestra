import type { XoTask } from '@/types/xo/task.type'
import type { Task } from '@core/types/task.type.ts'

export const convertTaskToCore = (task: XoTask, userName?: string): Task => ({
  id: task.id,
  status: task.status === 'interrupted' ? 'failure' : task.status,
  name: task.properties.name ? task.properties.name : '',
  tag: task.properties.type,
  progress: task.properties.progress !== undefined ? task.properties.progress : 0,
  userName,
  start: task.start,
  end: task.end,
  subtasks: task.tasks !== undefined ? task.tasks.map(subtask => convertTaskToCore(subtask, userName)) : undefined,
})
