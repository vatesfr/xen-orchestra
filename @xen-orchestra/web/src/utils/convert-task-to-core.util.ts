import type { XoTask } from '@/types/xo/task.type'
import type { Task } from '@core/components/ui/quick-task-item/UiQuickTaskItem.vue'

export const convertTaskToCore = (task: XoTask): Task => ({
  id: task.id,
  start: task.start,
  end: task.end,
  label: task.properties.name,
  progress: task.properties.progress,
  warningsCount: task.properties.warnings?.length,
  infosCount: task.properties.infos?.length,
  tasks: task.tasks !== undefined ? task.tasks.map(subtask => convertTaskToCore(subtask)) : undefined,
})
