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

      function handleTask(task: FrontXoTask | undefined) {
        if (task === undefined) {
          return
        }

        clearTimeout(timeout)
        if (task.status === 'success') {
          cleanup()
          resolve(task.result as TResult)
        } else if (task.status !== 'pending') {
          cleanup()
          reject(normalizeError(task.result, taskId))
        }
      }

      const stop = watch(task, handleTask)

      // Handle the initial value only once `stop` is initialized, as the task may already be settled
      handleTask(task.value)

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
