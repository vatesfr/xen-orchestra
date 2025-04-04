export type TaskStatus = 'pending' | 'success' | 'failure' | 'interrupted'

export type Task = {
  id: string | number
  name: string
  status: TaskStatus
  tag?: string
  start?: number
  end?: number
  subtasks?: Task[]
  progress?: number
  infos?: string[]
  errors?: string[]
  warnings?: string[]
}
