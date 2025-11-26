export type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'success'

export type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  progress?: number
  tag?: string
  userName?: string
  start?: number
  end?: number
  status: TaskStatus
  subtasks?: Task[]
  warning?: { data: unknown; message: string }[]
}
