import type { RouteLocationRaw } from 'vue-router'

export type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'success'

export type TaskNameSegment = {
  text: string
  to?: RouteLocationRaw
}

export type Task = {
  id: string
  infos?: { data: unknown; message: string }[]
  name?: string
  nameSegments?: TaskNameSegment[]
  progress?: number
  tag?: string
  userName?: string
  start?: number
  end?: number
  status: TaskStatus
  subtasks?: Task[]
  warnings?: { data: unknown; message: string }[]
}
