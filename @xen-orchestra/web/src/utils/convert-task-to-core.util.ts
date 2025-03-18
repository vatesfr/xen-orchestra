import type { XoTask } from '@/types/xo/task.type'
import type { Task as CoreTask } from '@core/types/task.type.ts'

export const convertTaskToCore = (task: XoTask): CoreTask => ({
  id: task.id,
  status: task.status === 'interrupted' ? 'failure' : task.status,
  name: task.properties.name,
  tag: task.properties.type,
  start: task.start,
  end: task.end,
  userId: task.properties.userId ?? undefined,
  infos: task.infos ?? undefined,
  errors: task.errors ?? undefined,
  warnings: task.warnings ?? undefined,
  progress: task.properties.progress ?? undefined,
  subtasks: Array.isArray(task.tasks) ? task.tasks.map(convertTaskToCore) : undefined,
})
