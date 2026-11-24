import type { TaskListContext } from '@core/components/task/VtsTaskList.vue'
import { IK_TASK_LIST_CONTEXT } from '@core/utils/injection-keys.util.ts'
import { inject } from 'vue'

export function useTaskListContext(): TaskListContext {
  const context = inject(IK_TASK_LIST_CONTEXT, undefined)

  if (context === undefined) {
    throw new Error('useTaskListContext needs a VtsTaskList parent')
  }

  return context
}
