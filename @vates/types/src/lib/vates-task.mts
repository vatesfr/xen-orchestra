import { Branded } from '../common.mjs'
import type { TASK_STATUS_TYPE } from '../common.mjs'

export type TaskData = {
  id: Branded<'task'>
  start: number
  pending: number
  end?: number
  updatedAt: number
  properties: Record<string, unknown>
  status: TASK_STATUS_TYPE
  tasks?: TaskData[]
}

export type Task = TaskData & {
  run: <T>(fn: () => T) => Promise<T>
}
