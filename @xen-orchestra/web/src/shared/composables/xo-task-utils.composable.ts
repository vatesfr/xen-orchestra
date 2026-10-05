import { type FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { watch } from 'vue'

/**
 * Normalize a Task error into a JS Error. Keep the original stacktrace
 */
function normalizeError(taskError: Record<string, unknown> | undefined, taskId: FrontXoTask['id']) {
  const error = new Error()

  if (taskError === undefined) {
    error.message = `Task ${taskId} failed without error details`
    return error
  }

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

  async function monitorTask<TResult>(taskId: FrontXoTask['id']): Promise<TResult> {
    const task = useGetTaskById(taskId)

    return new Promise((resolve, reject) => {
      // If the task is not found in the store after 2 seconds, we throw
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`task ID: ${taskId} never received`))
      }, 2000)

      const stop = watch(task, task => {
        if (settle(task)) {
          cleanup()
        }
      })

      // The task may already be over (e.g. a fast action)
      if (settle(task.value)) {
        cleanup()
      }

      // Returns true once the task is over, after resolving or rejecting the promise
      function settle(task: FrontXoTask | undefined) {
        if (task === undefined) {
          return false
        }

        clearTimeout(timeout)

        if (task.status === 'pending') {
          return false
        }

        if (task.status === 'success') {
          resolve(task.result as TResult)
        } else {
          reject(normalizeError(task.result, taskId))
        }

        return true
      }

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
