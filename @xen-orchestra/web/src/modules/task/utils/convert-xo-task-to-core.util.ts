import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { Task, TaskObjectSegment } from '@core/components/ui/task-item/UiTaskItem.vue'

export type ConvertXoTaskToCoreOptions = {
  userName?: string
  to?: Task['to'] | ((task: FrontXoTask) => Task['to'])
  nameResolver?: (name: string) => TaskObjectSegment[] | undefined
}

function mapXoTaskToCoreTask(task: FrontXoTask, userName?: string, to?: Task['to']): Task {
  return {
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
    to,
  }
}

export function convertXoTaskToCore(task: FrontXoTask, options?: ConvertXoTaskToCoreOptions): Task {
  const to = typeof options?.to === 'function' ? options.to(task) : options?.to
  const coreTask = mapXoTaskToCoreTask(task, options?.userName, to)

  if (options?.nameResolver && task.properties.name) {
    const nameParts = options.nameResolver(task.properties.name)
    if (nameParts !== undefined) {
      coreTask.nameParts = nameParts
    }
  }

  coreTask.subtasks = task.tasks?.map(subtask => convertXoTaskToCore(subtask, options))

  return coreTask
}
