export type TaskStatus = 'pending' | 'success' | 'failure' | 'interrupted'

export type Message = {
  message: string
}

export type Task = {
  id: string | number
  name: string
  status: TaskStatus
  tag: string
  start: number
  end?: number
  userId?: string
  subtasks?: Task[]
  progress?: number
  infos?: Message[]
  errors?: Message[]
  warnings?: Message[]
}
