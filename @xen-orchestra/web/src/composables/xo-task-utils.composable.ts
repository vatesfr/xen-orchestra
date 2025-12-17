import { useXoTaskCollection } from '@/remote-resources/use-xo-task-collection'
import type { XoTask } from '@vates/types'
import { watch } from 'vue'

export function useXoTaskUtils() {
  const { useGetTaskById } = useXoTaskCollection()

  async function monitorTask<TResult>(taskId: XoTask['id']): Promise<TResult> {
    const task = useGetTaskById(taskId)

    return new Promise((resolve, reject) => {
      // If the task asn't be found in the store after 2 seconds, we throw
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error(`task ID: ${taskId} never received`))
      }, 2000)

      const stop = watch(
        () => task.value,
        task => {
          if (task !== undefined) {
            clearTimeout(timeout)
            if (task.status === 'success') {
              cleanup()
              resolve(task.result as TResult)
            } else if (task.status === 'failure') {
              cleanup()
              reject(task.result)
            } else if (task.status !== 'pending') {
              cleanup()
              reject(task.result)
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
