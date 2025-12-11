import type { XoTask } from '@vates/types'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useTaskPropertiesUtils(rawTask: MaybeRefOrGetter<XoTask>) {
  const task = computed(() => toValue(rawTask))

  const properties = computed(() => {
    if (!task.value.properties) {
      return {}
    }

    const { method, name, type, objectId, params, progress, userId, ...other } = task.value.properties

    return {
      method,
      name,
      type,
      objectId,
      params,
      progress,
      userId,
      other,
    }
  })

  return { properties }
}
