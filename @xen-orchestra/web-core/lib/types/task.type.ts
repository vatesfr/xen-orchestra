export type TaskStatus = 'pending' | 'success' | 'failure'

export type TaskTab = TaskStatus | 'all'

export type Task = {
  id: string | number
  name: string
  tag: string
  status: TaskStatus
  start?: number
  end?: number
  subtasks?: Task[]
}
