export type TaskStatus = 'pending' | 'success' | 'failure'

export type TaskTab = TaskStatus | 'all'

export type Task = {
  id: string | number
  name: string
  status: TaskStatus
  tag?: string
  start?: number
  end?: number
  subtasks?: Task[]
}
