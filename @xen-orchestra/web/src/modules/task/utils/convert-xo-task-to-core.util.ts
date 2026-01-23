import type { Task } from '@core/types/task.type.ts'
import type { XoTask } from '@vates/types'

export const convertXoTaskToCore = (task: XoTask, userName?: string): Task => ({
  id: task.id,
  status: task.status === 'interrupted' ? 'failure' : task.status,
  name: task.properties.name ?? '',
  tag: task.properties.type,
  progress: typeof task.properties.progress === 'number' ? task.properties.progress : 0,
  userName,
  start: task.start,
  infos: task.infos,
  warnings: task.warnings,
  end: task.end,
  subtasks: task.tasks?.map(subtask => convertXoTaskToCore(subtask, userName)),
})
