import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoTask } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useTaskPropertiesUtils(rawTask: MaybeRefOrGetter<XoTask>) {
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
