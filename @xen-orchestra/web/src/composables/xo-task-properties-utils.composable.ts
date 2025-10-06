import type { XoTask } from '@/types/xo/task.type.ts'
import { computed } from 'vue'

export function useTaskPropertiesUtils(task: XoTask) {
  const properties = computed(() => {
    if (!task.properties) {
      return {}
    }

    const { method, name, type, objectId, params, progress, userId, ...other } = task.properties

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
