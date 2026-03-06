import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoTaskPropertiesUtils(rawTask: MaybeRefOrGetter<FrontXoTask>) {
  const task = toComputed(rawTask)

  const properties = computed(() => {
    if (!task.value.properties) {
      return {}
    }

    const { method, name, type, objectId, progress, userId, ...other } = task.value.properties

    return {
      method,
      name,
      type,
      objectId,
      progress,
      userId,
      other,
    }
  })

  return { properties }
}
