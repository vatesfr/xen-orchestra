import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import type { XoTask } from '@vates/types'
import { watch } from 'vue'

/**
 * Normalize a Task error into a JS Error. Keep the original stacktrace
 */
function normalizeError(taskError: Record<string, unknown>) {
  const error = new Error()

  if ('message' in taskError) {
    error.message = taskError.message as string
  }

  if ('name' in taskError) {
    error.name = taskError.name as string
  }

  if ('stack' in taskError) {
    error.stack = taskError.stack as string
  }

  return error
}

export function useXoTaskUtils() {
  const { useGetTaskById } = useXoTaskCollection()

  async function monitorTask<TResult>(taskId: XoTask['id']): Promise<TResult> {
    const task = useGetTaskById(taskId)

    return new Promise((resolve, reject) => {
      // If the task is not found in the store after 2 seconds, we throw
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`task ID: ${taskId} never received`))
      }, 2000)

      const stop = watch(
        task,
        task => {
          if (task !== undefined) {
            clearTimeout(timeout)
            if (task.status === 'success') {
              cleanup()
              resolve(task.result as TResult)
            } else if (task.status === 'failure') {
              cleanup()
              reject(normalizeError(task.result))
            } else if (task.status !== 'pending') {
              cleanup()
              reject(normalizeError(task.result))
            }
          }
        },
        {
          immediate: true,
        }
      )

      function cleanup() {
        stop()
        clearTimeout(timeout)
      }
    })
  }

  return {
    monitorTask,
  }
}
