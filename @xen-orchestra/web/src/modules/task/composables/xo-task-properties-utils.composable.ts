import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useXoTaskPropertiesUtils(rawTask: MaybeRefOrGetter<FrontXoTask | undefined>) {
  const task = toComputed(rawTask)

  const properties = computed(() => {
    const taskProperties = task.value?.properties

    if (!taskProperties) {
      return {}
    }

    const { method, name, type, objectId, progress, userId, ...other } = taskProperties

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
