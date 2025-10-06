import type { TaskStatus } from '@core/types/task.type.ts'

export const getTaskAccent = (status: TaskStatus, type: 'progress' | 'status') => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'success':
      return type === 'progress' ? 'info' : 'success'
    case 'failure':
      return 'danger'
    default:
      return 'info'
  }
}
