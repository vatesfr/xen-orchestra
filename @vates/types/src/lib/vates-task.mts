import { Branded } from '../common.mjs'
import type { TASK_STATUS_TYPE } from '../common.mjs'

export type Task = {
  id: Branded<'task'>
  start: number
  end: number
  pending: number
  updatedAt: number
  properties: Record<string, unknown>
  status: TASK_STATUS_TYPE
  tasks?: Task[]

  run: <T>(fn: () => T) => Promise<T>
}
