import { useXoTaskNameResolver } from '@/modules/task/composables/xo-task-name-resolver.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { Task } from '@core/components/ui/task-item/UiTaskItem.vue'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoTasksConversion(rawTasks: MaybeRefOrGetter<FrontXoTask[]>) {
  const { getUserById } = useXoUserCollection()
  const { resolveTaskName } = useXoTaskNameResolver()

  const tasks = toComputed(rawTasks)

  function convertTask(task: FrontXoTask, userName?: string): Task {
    const coreTask = convertXoTaskToCore({ ...task, tasks: undefined }, userName)

    if (task.properties.name) {
      const nameParts = resolveTaskName(task.properties.name)
      if (nameParts !== undefined) {
        coreTask.nameParts = nameParts
      }
    }

    coreTask.subtasks = task.tasks?.map(subtask => convertTask(subtask, userName))

    return coreTask
  }

  const convertedTasks = computed(() =>
    tasks.value.map(task => {
      const userId = task.properties.userId

      if (!userId) {
        return convertTask(task)
      }

      const user = getUserById(userId as XoUser['id'])
      const userName = user?.name ?? user?.email
      return convertTask(task, userName)
    })
  )

  return { convertedTasks }
}
