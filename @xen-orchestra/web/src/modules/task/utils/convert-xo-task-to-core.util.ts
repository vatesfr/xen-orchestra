import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { Task } from '@core/types/task.type.ts'

export const convertXoTaskToCore = (task: FrontXoTask, userName?: string): Task => ({
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
