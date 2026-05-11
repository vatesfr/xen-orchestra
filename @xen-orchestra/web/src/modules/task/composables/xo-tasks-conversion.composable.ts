import { useXoTaskNameResolver } from '@/modules/task/composables/xo-task-name-resolver.composable.ts'
import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { convertXoTaskToCore } from '@/modules/task/utils/convert-xo-task-to-core.util.ts'
import { useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import type { Task } from '@core/types/task.type.ts'
import type { XoUser } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useXoTasksConversion(rawTasks: MaybeRefOrGetter<FrontXoTask[]>) {
  const { getUserById } = useXoUserCollection()
  const { resolveTaskName } = useXoTaskNameResolver()

  function convertTask(task: FrontXoTask, userName?: string): Task {
    const coreTask = convertXoTaskToCore(task, userName)

    const name = task.properties.name
    if (name) {
      const nameSegments = resolveTaskName(name)
      if (nameSegments !== undefined) {
        coreTask.nameSegments = nameSegments
      }
    }

    coreTask.subtasks = task.tasks?.map(subtask => convertTask(subtask, userName))

    return coreTask
  }

  const convertedTasks = computed(() =>
    toValue(rawTasks).map(task => {
      const userId = task.properties.userId
      const user = userId ? getUserById(userId as XoUser['id']) : undefined
      const userName = user?.name ?? user?.email
      return convertTask(task, userName)
    })
  )

  return { convertedTasks }
}
