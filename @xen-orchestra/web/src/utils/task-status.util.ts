import type { CircleProgressBarAccent } from '@core/components/ui/circle-progress-bar/UiCircleProgressBar.vue'
import type { TaskStatus } from '@core/types/task.type.ts'

export type StatusAccent = 'info' | 'warning' | 'danger' | 'success'

export type TaskAccents = {
  statusAccent: StatusAccent
  progressAccent: CircleProgressBarAccent
}

export const getTaskAccents = (status: TaskStatus): TaskAccents => {
  switch (status) {
    case 'pending':
      return { statusAccent: 'info', progressAccent: 'info' }
    case 'success':
      return { statusAccent: 'success', progressAccent: 'info' }
    case 'failure':
      return { statusAccent: 'danger', progressAccent: 'danger' }
    default:
      return { statusAccent: 'info', progressAccent: 'info' }
  }
}
