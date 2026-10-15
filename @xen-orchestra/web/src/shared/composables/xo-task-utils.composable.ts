import { type FrontXoTask, useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { watch } from 'vue'

export type MonitoredTaskError = Error & {
  taskId: FrontXoTask['id']
}

/**
 * Normalize a Task error into a JS Error. Keep the original stacktrace and the task ID
 */
function normalizeError(taskError: Record<string, unknown> | undefined, taskId: FrontXoTask['id']) {
  const error: MonitoredTaskError = Object.assign(new Error(), { taskId })

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

export function isMonitoredTaskError(error: unknown): error is MonitoredTaskError {
  return error instanceof Error && 'taskId' in error
}

export function getErrorTaskId(error: unknown): FrontXoTask['id'] | undefined {
  if (!isMonitoredTaskError(error)) {
    return undefined
  }

  return error.taskId
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

      const stop = watch(task, settle)

      // The task may already be over (e.g. a fast action)
      settle(task.value)

      function settle(task: FrontXoTask | undefined) {
        if (task === undefined) {
          return
        }

        clearTimeout(timeout)

        if (task.status === 'pending') {
          return
        }

        cleanup()

        if (task.status === 'success') {
          resolve(task.result as TResult)
        } else {
          reject(normalizeError(task.result, taskId))
        }
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
