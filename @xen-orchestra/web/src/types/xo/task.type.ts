import type { Branded } from '@core/types/utility.type'

export type XoTask = {
  id: Branded<'task'>
  type: 'task'
  start: number
  end: number | undefined
  properties: {
    type?: string
    name?: string
    progress?: number
    objectId?: string
    args?: Record<string, unknown>
    warnings?: { message: string; data: Record<string, unknown> }[]
    infos?: { message: string; data: Record<string, unknown> }[]
    [key: string]: unknown | undefined
  }
  status: 'pending' | 'success' | 'failure' | 'interrupted'
  result?: string
  tasks?: XoTask[]
}
